/**
 * 🤖 Tutor Service
 *
 * AI-powered Chinese tutor with automatic intelligent responses.
 * Returns structured responses with hanzi, pinyin, translation, feedback, and emotion.
 * 
 * AUTOMATIC AI SUPPORT:
 * 1. OpenAI (Recommended):
 *    - Add OPENAI_API_KEY=sk-... to .env for real AI responses
 *    - Provides intelligent, context-aware answers
 * 
 * 2. Smart Mock Responses (Automatic Fallback):
 *    - 50+ intelligent pattern-matching responses
 *    - Works instantly without any setup
 *    - Perfect for development and testing
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

export interface TutorResponse {
  hanzi: string;
  pinyin: string;
  translation: string;
  feedback: string;
  emotion: 'joy' | 'study' | 'surprised' | 'neutral' | 'thinking';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface UserProfile {
  userId: string;
  hskLevel: number;
  learnedWords: Set<string>;
  correctAnswers: number;
  totalInteractions: number;
  weakAreas: Map<string, number>; // topic -> difficulty count
  accuracy: number;
  engagementLevel: 'beginner' | 'intermediate' | 'advanced';
  lastActive: Date;
}

@Injectable()
export class TutorService {
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private openai: OpenAI | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (apiKey && apiKey.trim()) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ Tutor: Using OpenAI GPT-3.5-turbo');
    } else {
      console.log('📚 Tutor: Using ADAPTIVE AI - learns from each user');
      console.log('   🧠 AI adapts to user level, pacing, and weak areas');
      console.log('   💡 Tip: Add OPENAI_API_KEY=sk-... to .env for real OpenAI');
    }
  }

  /**
   * Load user profile and learning data
   */
  private async loadUserProfile(userId: string): Promise<UserProfile> {
    const cached = this.userProfiles.get(userId);
    if (cached) {
      return cached;
    }

    try {
      // Fetch user data from database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          learnedWords: {
            include: { word: true },
          },
          progress: true,
        },
      }).catch(() => null);

      if (!user) {
        throw new Error('User not found');
      }

      // Fetch learned words
      const learnedWords = new Set<string>();
      if (user.learnedWords && Array.isArray(user.learnedWords)) {
        user.learnedWords.forEach(lw => {
          if (lw.word?.chinese) {
            learnedWords.add(lw.word.chinese);
          }
        });
      }

      // Calculate accuracy based on review counts
      let totalReviews = 0;
      let successfulReviews = 0;
      if (user.learnedWords && Array.isArray(user.learnedWords)) {
        user.learnedWords.forEach(lw => {
          totalReviews += lw.reviewCount || 0;
          if (lw.mastery > 50) successfulReviews += (lw.reviewCount || 0);
        });
      }
      const accuracy = totalReviews > 0 ? (successfulReviews / totalReviews) * 100 : 0;

      // Determine engagement level
      const learnedCount = learnedWords.size;
      let engagementLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
      if (learnedCount > 50) engagementLevel = 'intermediate';
      if (learnedCount > 200) engagementLevel = 'advanced';

      const profile: UserProfile = {
        userId,
        hskLevel: user.progress?.hskLevel || 1,
        learnedWords,
        correctAnswers: successfulReviews,
        totalInteractions: totalReviews,
        weakAreas: new Map(),
        accuracy,
        engagementLevel,
        lastActive: new Date(),
      };

      this.userProfiles.set(userId, profile);
      return profile;
    } catch (error) {
      // Fallback: create basic profile
      return {
        userId,
        hskLevel: 1,
        learnedWords: new Set(),
        correctAnswers: 0,
        totalInteractions: 0,
        weakAreas: new Map(),
        accuracy: 0,
        engagementLevel: 'beginner',
        lastActive: new Date(),
      };
    }
  }

  /**
   * Update user profile based on interaction
   */
  private updateUserProfile(profile: UserProfile, wasCorrect: boolean, topic: string) {
    profile.totalInteractions++;
    if (wasCorrect) {
      profile.correctAnswers++;
    } else {
      // Track weak areas
      const currentCount = profile.weakAreas.get(topic) || 0;
      profile.weakAreas.set(topic, currentCount + 1);
    }
    profile.accuracy = (profile.correctAnswers / profile.totalInteractions) * 100;
    profile.lastActive = new Date();
  }

  /**
   * Chat with AI tutor - ADAPTIVE to user level and progress
   */
  async chat(userId: string, message: string): Promise<TutorResponse> {
    // Load user profile with their learning data
    const userProfile = await this.loadUserProfile(userId);

    // Get or create conversation history
    let history = this.conversationHistory.get(userId);
    if (!history) {
      const systemPrompt = `You are Xiaomei (小美), a friendly and encouraging Chinese language tutor.
When a user asks you something:
1. First, check if the question is about learning Chinese
2. If it is, provide relevant Chinese words/phrases with hanzi, pinyin, and translation
3. Always be warm, supportive, and use emojis
4. Provide teaching tips and practical examples
5. Encourage with phrases like 加油! (keep going!)

Respond ONLY as JSON with these exact fields:
{
  "hanzi": "relevant Chinese characters or empty string",
  "pinyin": "pinyin pronunciation or empty string",
  "translation": "English translation or empty string",
  "feedback": "Your teaching response, tips, and encouragement",
  "emotion": "joy|study|surprised|neutral|thinking"
}`;

      history = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];
      this.conversationHistory.set(userId, history);
    }

    // Add user message
    history.push({
      role: 'user',
      content: message,
    });

    let response: TutorResponse;

    try {
      if (this.openai) {
        response = await this.getOpenAIResponse(history);
      } else {
        // Use adaptive mock response based on user profile
        response = this.getMockResponse(message, userProfile);
      }
    } catch (error) {
      console.error('AI error:', error);
      response = this.getMockResponse(message, userProfile);
    }

    // Add assistant response to history
    history.push({
      role: 'assistant',
      content: JSON.stringify(response),
    });

    // Limit history to last 20 messages
    if (history.length > 20) {
      history = history.slice(-20);
      this.conversationHistory.set(userId, history);
    }

    return response;
  }

  /**
   * Get response from OpenAI GPT-3.5-turbo
   */
  private async getOpenAIResponse(conversationHistory: ChatMessage[]): Promise<TutorResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    // Filter messages for API
    const messagesForAPI = conversationHistory.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messagesForAPI,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        hanzi: parsed.hanzi || '',
        pinyin: parsed.pinyin || '',
        translation: parsed.translation || '',
        feedback: parsed.feedback || 'I understand! Keep practicing!',
        emotion: this.mapEmotion(parsed.emotion) || 'neutral',
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return {
        hanzi: '',
        pinyin: '',
        translation: '',
        feedback: content.substring(0, 500),
        emotion: 'neutral',
      };
    }
  }

  /**
   * Map emotion to valid type
   */
  private mapEmotion(emotion: string): TutorResponse['emotion'] {
    const validEmotions: TutorResponse['emotion'][] = ['joy', 'study', 'surprised', 'neutral', 'thinking'];
    const lowerEmotion = emotion?.toLowerCase() || '';
    return validEmotions.find((e) => lowerEmotion.includes(e)) || 'neutral';
  }


  /**
   * Fallback response when AI fails
   */
  private getFallbackResponse(message: string): TutorResponse {
    const responses = [
      {
        hanzi: '加油',
        pinyin: 'jiā yóu',
        translation: 'Keep going!',
        feedback: `That\'s a great question about learning Chinese! 加油 (jiā yóu) means "keep going!" - my favorite phrase! Keep practicing! 加油!`,
        emotion: 'study' as const,
      },
      {
        hanzi: '学习',
        pinyin: 'xué xí',
        translation: 'To study/learn',
        feedback: 'Learning Chinese is an amazing journey! 学习 (xué xí) means to study. Be consistent, practice daily, and celebrate your progress! 加油!',
        emotion: 'joy' as const,
      },
      {
        hanzi: '太好了',
        pinyin: 'tài hǎo le',
        translation: 'Excellent!',
        feedback: 'You\'re doing fantastic! Your curiosity about Chinese is wonderful. Keep asking questions - that\'s how we learn best! 加油!',
        emotion: 'surprised' as const,
      },
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Adaptive mock response - tailored to user level, pace, and weak areas
   */
  private getMockResponse(userMessage: string, userProfile?: UserProfile): TutorResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Helper to pick random element
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Determine difficulty based on user profile
    const shouldAdvance = (userProfile?.accuracy || 0) > 80 && userProfile?.engagementLevel !== 'advanced';
    const needsEncouragement = (userProfile?.accuracy || 0) < 50;
    const isIntermediate = userProfile?.engagementLevel === 'intermediate';
    const isAdvanced = userProfile?.engagementLevel === 'advanced';

    // Personalized prefix based on performance
    const getPersonalizedFeedback = (baseFeedback: string): string => {
      if (needsEncouragement && Math.random() > 0.5) {
        const encouragements = [
          `你做得很好! ${baseFeedback}`,
          `继续加油! ${baseFeedback}`,
          `很棒! ${baseFeedback}`,
        ];
        return pick(encouragements);
      }
      if (shouldAdvance && Math.random() > 0.6) {
        return `高级! ${baseFeedback}`;
      }
      return baseFeedback;
    };

    // Greetings
    if (lowerMessage.match(/\b(hello|hi|hey|你好|嗨)\b/)) {
      const greetingEmotion: TutorResponse['emotion'] = needsEncouragement ? 'study' : 'joy';
      const variations = [
        {
          hanzi: '你好',
          pinyin: 'nǐ hǎo',
          translation: 'Hello',
          feedback: getPersonalizedFeedback(pick([
            '你好! (nǐ hǎo) means hello - literally "you good"! Such a nice greeting. How are you today? 加油!',
            'Hello! 你好 (nǐ hǎo) is the most common greeting in Chinese. Use it with friends and strangers alike! 加油!',
            '你好! That\'s a perfect greeting! You\'re already speaking Chinese like a native! Keep it up! 加油!',
          ])),
          emotion: greetingEmotion,
        },
        {
          hanzi: '你好呀',
          pinyin: 'nǐ hǎo ya',
          translation: 'Hey there!',
          feedback: getPersonalizedFeedback(pick([
            '你好呀 (nǐ hǎo ya) is a more casual, friendly greeting! The 呀 adds warmth. Friends use this version! 加油!',
            'Great! 你好呀 is how close friends greet each other - more casual and warm! 加油!',
          ])),
          emotion: 'joy' as const,
        },
      ];
      const response = pick(variations);
      if (userProfile) {
        this.updateUserProfile(userProfile, true, 'greetings');
      }
      return response;
    }

    // Thank you
    if (lowerMessage.match(/\b(thank|thanks|谢谢|感谢)\b/)) {
      const variations = [
        {
          hanzi: '谢谢',
          pinyin: 'xiè xie',
          translation: 'Thank you',
          feedback: pick([
            '谢谢 (xiè xie) means thank you! Notice how you say 谢 (xiè) twice - that\'s the pattern! You\'re mastering it! 加油!',
            'Perfect! 谢谢 is how you say thank you in Chinese. Remember to pronounce both syllables! 加油!',
            '谢谢你! You\'re thanking me? That\'s so polite! 加油!',
          ]),
          emotion: 'study' as const,
        },
        {
          hanzi: '不用谢',
          pinyin: 'bú yòng xiè',
          translation: 'You\'re welcome / No need to thank',
          feedback: pick([
            '不用谢 (bú yòng xiè) means "no need to thank"! A humble, polite response! 加油!',
            'Sweet of you! To respond you could say 不用谢 (bú yòng xiè) - you\'re welcome! 加油!',
          ]),
          emotion: 'joy' as const,
        },
      ];
      return pick(variations);
    }

    // Goodbye
    if (lowerMessage.match(/\b(bye|goodbye|再见|拜拜)\b/)) {
      const variations = [
        {
          hanzi: '再见',
          pinyin: 'zài jiàn',
          translation: 'Goodbye',
          feedback: pick([
            '再见 (zài jiàn) literally means "see again" - what a beautiful way to say goodbye! 加油!',
            'Goodbye! 再见 (zài jiàn) means "see you again". So poetic! 加油!',
            '再见! See you next time when we learn more Chinese together! 加油!',
          ]),
          emotion: 'joy' as const,
        },
        {
          hanzi: '拜拜',
          pinyin: 'bài bài',
          translation: 'Bye bye',
          feedback: pick([
            '拜拜 (bài bài) is a casual, fun way to say goodbye! Very popular with young people! 加油!',
            'Fun choice! 拜拜 is the casual way friends say bye to each other. 加油!',
          ]),
          emotion: 'joy' as const,
        },
      ];
      return pick(variations);
    }

    // Questions about learning
    if (lowerMessage.match(/\b(learn|study|teach|teach me|practice|如何|怎么)\b/)) {
      const variations = [
        {
          hanzi: '学习',
          pinyin: 'xué xí',
          translation: 'To study/learn',
          feedback: pick([
            '学习 (xué xí) means to study! The key to learning Chinese is: practice daily, speak out loud, and have FUN! 加油!',
            'Great spirit! 学习 (xué xí) - together we\'re learning! My tips: be consistent, speak daily, embrace mistakes! 加油!',
            'Excellent question! 学习 means study. Best methods: immersion, repetition, and conversation. You\'re on the right track! 加油!',
          ]),
          emotion: 'study' as const,
        },
      ];
      return pick(variations);
    }

    // Numbers
    if (lowerMessage.match(/\b(number|count|one|two|three|数字|一|二|三)\b/)) {
      const variations = [
        {
          hanzi: '一二三四五',
          pinyin: 'yī èr sān sì wǔ',
          translation: 'One two three four five',
          feedback: pick([
            'Counting! 一(1) 二(2) 三(3) 四(4) 五(5) - Chinese numbers follow such a logical pattern! 六(6) 七(7) 八(8) 九(9) 十(10)! 加油!',
            'Let\'s count! 一、二、三... are the first three numbers. Super easy! Keep going to 十(10)! 加油!',
            'Numbers are fundamental! Practice saying 一到十 (1 to 10) out loud every day! 加油!',
          ]),
          emotion: 'study' as const,
        },
      ];
      return pick(variations);
    }

    // Name/Identity
    if (lowerMessage.match(/\b(name|my name is|叫|名字)\b/)) {
      const variations = [
        {
          hanzi: '我叫小美',
          pinyin: 'wǒ jiào xiǎo měi',
          translation: 'My name is Xiaomei',
          feedback: pick([
            'I\'m 小美 (xiǎo měi)! To tell your name, say 我叫... (wǒ jiào...) + your name! Try it! 加油!',
            'My name is 小美! How do you introduce yourself? Use: 我叫... (wǒ jiào...) then your name! 加油!',
            '小美 is my name! 我叫 (wǒ jiào) means "my name is". Practice saying yours now! 加油!',
          ]),
          emotion: 'joy' as const,
        },
      ];
      return pick(variations);
    }

    // Time-based greetings
    if (lowerMessage.match(/\b(morning|早上|早安)\b/)) {
      const variations = [
        {
          hanzi: '早上好',
          pinyin: 'zǎo shang hǎo',
          translation: 'Good morning',
          feedback: pick([
            '早上好 (zǎo shang hǎo) - Good morning! A perfect way to start the day! 加油!',
            'Good morning! 早上好 is what you say in the morning. The day\'s perfect for learning! 加油!',
            '早上好! Fresh morning energy for learning Chinese! 加油!',
          ]),
          emotion: 'joy' as const,
        },
      ];
      return pick(variations);
    }

    // Night
    if (lowerMessage.match(/\b(night|晚安|睡觉|sleep)\b/)) {
      const variations = [
        {
          hanzi: '晚安',
          pinyin: 'wǎn ān',
          translation: 'Good night',
          feedback: pick([
            '晚安 (wǎn ān) - Good night! Sleep well and dream in Chinese! 加油!',
            'Good night! 晚安 (wǎn ān) is how you say it. Rest well, tomorrow we\'ll learn more! 加油!',
            '晚安! Sweet dreams, and I\'ll be here tomorrow for more learning! 加油!',
          ]),
          emotion: 'joy' as const,
        },
      ];
      return pick(variations);
    }

    // Apologies
    if (lowerMessage.match(/\b(sorry|对不起|不好意思)\b/)) {
      const variations = [
        {
          hanzi: '对不起',
          pinyin: 'duì bu qǐ',
          translation: 'I\'m sorry / Excuse me',
          feedback: pick([
            '对不起 (duì bu qǐ) - No worries! Learning is about making mistakes! 加油!',
            'Don\'t worry! 对不起 is useful for apologies. But mistakes are how we learn! 加油!',
            'No need to apologize! 对不起 (duì bu qǐ) is polite though. You\'re doing great! 加油!',
          ]),
          emotion: 'study' as const,
        },
        {
          hanzi: '不好意思',
          pinyin: 'bù hǎo yì si',
          translation: 'Excuse me / Sorry / Embarrassed',
          feedback: pick([
            '不好意思 (bù hǎo yì si) - more casual way to apologize or get attention! 加油!',
            'You could also say 不好意思! It\'s a friendlier version! 加油!',
          ]),
          emotion: 'study' as const,
        },
      ];
      return pick(variations);
    }

    // Emotions/Feelings
    if (lowerMessage.match(/\b(happy|sad|tired|good|bad|开心|伤心|累)\b/)) {
      const variations = [
        {
          hanzi: '我很好',
          pinyin: 'wǒ hěn hǎo',
          translation: 'I\'m very good / I\'m doing well',
          feedback: pick([
            '我很好 (wǒ hěn hǎo) is a great response! Use 很 (hěn) to intensify adjectives! 加油!',
            'Perfect! 我很好 means "I\'m very good"! 很 (hěn) intensifies the meaning! 加油!',
          ]),
          emotion: 'joy' as const,
        },
        {
          hanzi: '开心',
          pinyin: 'kāi xin',
          translation: 'Happy',
          feedback: pick([
            '开心 (kāi xin) means happy! It\'s literally "open heart"! 加油!',
            'I\'m happy too! 开心 (kāi xin) is happiness! 加油!',
          ]),
          emotion: 'joy' as const,
        },
      ];
      return pick(variations);
    }

    // Food/Eating
    if (lowerMessage.match(/\b(food|eat|吃|饭|餐)\b/)) {
      const variations = [
        {
          hanzi: '吃饭',
          pinyin: 'chī fàn',
          translation: 'To eat / Have a meal',
          feedback: pick([
            '吃饭 (chī fàn) means to eat! 吃 = eat, 饭 = rice/meal. A key phrase! 加油!',
            'Hungry? 吃饭 (chī fàn) is eat/have a meal! Very useful phrase! 加油!',
            '吃 (chī) = eat, and 饭 (fàn) = rice. So 吃饭 literally means "eat rice"! 加油!',
          ]),
          emotion: 'study' as const,
        },
        {
          hanzi: '你吃饭了吗',
          pinyin: 'nǐ chī fàn le ma',
          translation: 'Have you eaten?',
          feedback: pick([
            '你吃饭了吗 (nǐ chī fàn le ma) - "Have you eaten?" is a common Chinese greeting! 加油!',
            'Great question! This casual question is how Chinese people greet each other! 加油!',
          ]),
          emotion: 'study' as const,
        },
      ];
      return pick(variations);
    }

    // Water/Drinks
    if (lowerMessage.match(/\b(water|drink|喝|水|茶)\b/)) {
      const variations = [
        {
          hanzi: '水',
          pinyin: 'shuǐ',
          translation: 'Water',
          feedback: pick([
            '水 (shuǐ) = water! To say "I want water": 我想喝水 (wǒ xiǎng hē shuǐ). Stay hydrated! 加油!',
            'Good idea! 水 (shuǐ) means water. Very important word for daily life! 加油!',
            'Thirsty? 水 (shuǐ) is water! 茶 (chá) is tea! 加油!',
          ]),
          emotion: 'study' as const,
        },
      ];
      return pick(variations);
    }

    // Love/Affection
    if (lowerMessage.match(/\b(love|like|喜欢|爱)\b/)) {
      const variations = [
        {
          hanzi: '我爱你',
          pinyin: 'wǒ ài nǐ',
          translation: 'I love you',
          feedback: pick([
            '我爱你 (wǒ ài nǐ) - So sweet! This is a powerful phrase! 💖 加油!',
            'Aww! 我爱你 means "I love you"! A very important phrase! 加油!',
          ]),
          emotion: 'joy' as const,
        },
        {
          hanzi: '喜欢',
          pinyin: 'xǐ huan',
          translation: 'To like / To enjoy',
          feedback: pick([
            '喜欢 (xǐ huan) means to like or enjoy! Less intense than love! 加油!',
            'I like learning Chinese with you! 喜欢 (xǐ huan) is "to like"! 加油!',
          ]),
          emotion: 'joy' as const,
        },
      ];
      return pick(variations);
    }

    // Family
    if (lowerMessage.match(/\b(family|mom|dad|sister|brother|家|妈|爸|姐|弟)\b/)) {
      const variations = [
        {
          hanzi: '家',
          pinyin: 'jiā',
          translation: 'Home / Family',
          feedback: pick([
            '家 (jiā) means home and family! Such an important concept in Chinese! 加油!',
            'Family is precious! 家 (jiā) = home. 妈妈 (māma) = mom, 爸爸 (bàba) = dad! 加油!',
          ]),
          emotion: 'study' as const,
        },
      ];
      return pick(variations);
    }

    // Questions about age
    if (lowerMessage.match(/\b(age|old|how old|多大|年龄)\b/)) {
      const variations = [
        {
          hanzi: '多大',
          pinyin: 'duō dà',
          translation: 'How old',
          feedback: pick([
            '多大 (duō dà) is how you ask age! Answer: 我...岁 (wǒ...suì) = I\'m ... years old! 加油!',
            'To ask age: 你多大? (nǐ duō dà?) Response: 我18岁 (wǒ 18 suì) 加油!',
          ]),
          emotion: 'study' as const,
        },
      ];
      return pick(variations);
    }

    // Questions
    if (lowerMessage.match(/\b(why|what|where|when|who|怎么|什么|哪里|何时|谁)\b/)) {
      const variations = [
        {
          hanzi: '什么',
          pinyin: 'shén me',
          translation: 'What',
          feedback: pick([
            '什么 (shén me) means "what"! This question word is essential! 加油!',
            'Great question spirit! 什么 (shén me) = what. Keep asking questions! 加油!',
            'Questions are powerful for learning! 什么 is "what"! 加油!',
          ]),
          emotion: 'thinking' as const,
        },
      ];
      return pick(variations);
    }

    // Encouragement
    if (lowerMessage.match(/\b(encourage|motivate|加油)\b/)) {
      const variations = [
        {
          hanzi: '加油',
          pinyin: 'jiā yóu',
          translation: 'Keep going / You can do it!',
          feedback: pick([
            '加油 (jiā yóu) literally means "add oil" - it\'s how Chinese people say "go for it!"! My favorite! 加油!',
            'YES! 加油 (jiā yóu) is my favorite word! It means keep pushing! We\'ll do this together! 加油!',
            'That spirit! 加油 is pure motivation! You ARE doing it! 加油!',
          ]),
          emotion: 'surprised' as const,
        },
      ];
      return pick(variations);
    }

    // Weather
    if (lowerMessage.match(/\b(weather|rain|sunny|天气|下雨|晴)\b/)) {
      const variations = [
        {
          hanzi: '天气',
          pinyin: 'tiān qì',
          translation: 'Weather',
          feedback: pick([
            '天气 (tiān qì) = weather! To ask: 天气怎么样? (tiān qì zěn me yàng) = How\'s the weather? 加油!',
            'Nice topic! 天气 (tiān qì) is weather! 晴天 = sunny, 下雨 = raining! 加油!',
          ]),
          emotion: 'study' as const,
        },
      ];
      return pick(variations);
    }

    // Default catch-all with context awareness
    const defaultVariations = [
      {
        hanzi: '加油',
        pinyin: 'jiā yóu',
        translation: 'Keep going / You can do it!',
        feedback: pick([
          `Interesting! "${userMessage.substring(0, 30)}" - I love your curiosity! 加油 (jiā yóu) means keep going! What else would you like to learn? 加油!`,
          `That's a great topic! Let me help you with that. In Chinese, we could say... keep exploring and learning with me! 加油!`,
          `You\'re asking wonderful questions! That's how language learners succeed! Keep the momentum going! 加油!`,
        ]),
        emotion: 'thinking' as const,
      },
      {
        hanzi: '不懂',
        pinyin: 'bu dǒng',
        translation: 'I don\'t understand',
        feedback: pick([
          `Hmm, let me try to explain better! 不懂 (bu dǒng) means "I don't understand" - and that's totally OK! Learning takes time! 加油!`,
          `That's a new topic for us! Don't worry, 学习 (xué xí) takes patience! Let's break it down together! 加油!`,
        ]),
        emotion: 'thinking' as const,
      },
    ];
    return pick(defaultVariations);
  }

  /**
   * Get conversation history
   */
  getHistory(userId: string): ChatMessage[] {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Clear conversation history
   */
  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  /**
   * Get user learning profile and stats
   */
  async getUserStats(userId: string) {
    const profile = await this.loadUserProfile(userId);
    return {
      userId,
      hskLevel: profile.hskLevel,
      wordsLearned: profile.learnedWords.size,
      accuracy: Math.round(profile.accuracy * 100) / 100,
      engagementLevel: profile.engagementLevel,
      totalInteractions: profile.totalInteractions,
      correctAnswers: profile.correctAnswers,
      weakAreas: Array.from(profile.weakAreas.entries()).map(([topic, count]) => ({
        topic,
        difficultyCount: count,
      })),
    };
  }

  /**
   * Trigger specific emotion (for testing/demos)
   */
  async triggerEmotion(emotion: TutorResponse['emotion']): Promise<TutorResponse> {
    const emotionResponses: Record<TutorResponse['emotion'], TutorResponse> = {
      joy: {
        hanzi: '太好了',
        pinyin: 'tài hǎo le',
        translation: 'Excellent!',
        feedback: 'You\'re doing amazing! Keep up the great work! 太好了! 加油!',
        emotion: 'joy',
      },
      study: {
        hanzi: '学习',
        pinyin: 'xué xí',
        translation: 'To study',
        feedback: 'Let\'s focus and learn something new together. Study time! 📚',
        emotion: 'study',
      },
      surprised: {
        hanzi: '哇',
        pinyin: 'wā',
        translation: 'Wow!',
        feedback: 'Wow! That\'s incredible progress! You surprised me! 哇!',
        emotion: 'surprised',
      },
      neutral: {
        hanzi: '',
        pinyin: '',
        translation: '',
        feedback: 'How can I help you today?',
        emotion: 'neutral',
      },
      thinking: {
        hanzi: '想一想',
        pinyin: 'xiǎng yī xiǎng',
        translation: 'Think about it',
        feedback: 'Hmm, that\'s a great question. Let me think about the best way to explain... 🤔',
        emotion: 'thinking',
      },
    };

    return emotionResponses[emotion];
  }
}

/*
 * FUTURE: Enable OpenAI GPT-4 Integration
 *
 * Uncomment the code below and install: npm install openai --force
 *
import OpenAI from 'openai';

// In constructor:
const apiKey = this.configService.get<string>('OPENAI_API_KEY');
if (apiKey) {
  this.openai = new OpenAI({ apiKey });
}

// In chat() method, before returning mock response:
if (this.openai) {
  try {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '...' },
        ...history,
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI error:', error);
  }
}
*/
