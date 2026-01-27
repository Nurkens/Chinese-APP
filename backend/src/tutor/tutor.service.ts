/**
 * 🤖 Tutor Service
 *
 * AI-powered Chinese tutor with mock responses.
 * Returns structured responses with hanzi, pinyin, translation, feedback, and emotion.
 *
 * NOTE: OpenAI integration temporarily disabled due to package installation issues.
 * Service currently uses intelligent mock responses based on pattern matching.
 *
 * To enable OpenAI later:
 * 1. npm install openai --force
 * 2. Uncomment OpenAI import and implementation below
 * 3. Add OPENAI_API_KEY to .env
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class TutorService {
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  constructor(private configService: ConfigService) {
    console.log('✅ Tutor Service initialized (using mock responses)');
  }

  /**
   * Chat with AI tutor
   */
  async chat(userId: string, message: string): Promise<TutorResponse> {
    // Get or create conversation history
    let history = this.conversationHistory.get(userId);
    if (!history) {
      history = [];
      this.conversationHistory.set(userId, history);
    }

    // Add user message to history
    history.push({
      role: 'user',
      content: message,
    });

    // Generate mock response
    const response = this.getMockResponse(message);

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
   * Mock response for development/fallback
   */
  private getMockResponse(userMessage: string): TutorResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('你好')) {
      return {
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        translation: 'Hello',
        feedback: 'Awesome! 你好 (nǐ hǎo) means hello! It\'s the first word everyone learns. Want to learn more greetings? 加油!',
        emotion: 'joy',
      };
    }

    // Thank you
    if (lowerMessage.includes('thank') || lowerMessage.includes('谢谢')) {
      return {
        hanzi: '谢谢',
        pinyin: 'xiè xie',
        translation: 'Thank you',
        feedback: 'Great! 谢谢 (xiè xie) is how you say thank you. Remember to repeat the 谢 twice! 加油!',
        emotion: 'study',
      };
    }

    // Goodbye
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('再见')) {
      return {
        hanzi: '再见',
        pinyin: 'zài jiàn',
        translation: 'Goodbye',
        feedback: '再见 (zài jiàn) means goodbye! Literally it means "see again" - how nice! 加油!',
        emotion: 'joy',
      };
    }

    // Numbers
    if (lowerMessage.includes('number') || lowerMessage.includes('count') || lowerMessage.includes('one')) {
      return {
        hanzi: '一二三',
        pinyin: 'yī èr sān',
        translation: 'One two three',
        feedback: 'Let\'s count! 一 (yī) = 1, 二 (èr) = 2, 三 (sān) = 3. Chinese numbers are super logical! 加油!',
        emotion: 'study',
      };
    }

    // How are you
    if (lowerMessage.includes('how are you') || lowerMessage.includes('怎么样')) {
      return {
        hanzi: '你好吗',
        pinyin: 'nǐ hǎo ma',
        translation: 'How are you?',
        feedback: 'To ask "how are you?" say 你好吗 (nǐ hǎo ma). You can answer with 我很好 (wǒ hěn hǎo) - I\'m very good! 加油!',
        emotion: 'joy',
      };
    }

    // Name
    if (lowerMessage.includes('name') || lowerMessage.includes('my name') || lowerMessage.includes('叫')) {
      return {
        hanzi: '我叫小美',
        pinyin: 'wǒ jiào xiǎo měi',
        translation: 'My name is Xiaomei',
        feedback: 'To say your name, use: 我叫... (wǒ jiào...). For example, I say 我叫小美 (wǒ jiào xiǎo měi) - My name is Xiaomei! 加油!',
        emotion: 'joy',
      };
    }

    // Good morning
    if (lowerMessage.includes('morning') || lowerMessage.includes('早上')) {
      return {
        hanzi: '早上好',
        pinyin: 'zǎo shang hǎo',
        translation: 'Good morning',
        feedback: '早上好 (zǎo shang hǎo) means good morning! Perfect for greeting friends in the morning. 加油!',
        emotion: 'joy',
      };
    }

    // Good night
    if (lowerMessage.includes('night') || lowerMessage.includes('晚安')) {
      return {
        hanzi: '晚安',
        pinyin: 'wǎn ān',
        translation: 'Good night',
        feedback: '晚安 (wǎn ān) means good night! Sweet dreams and keep studying tomorrow! 加油!',
        emotion: 'joy',
      };
    }

    // Sorry
    if (lowerMessage.includes('sorry') || lowerMessage.includes('对不起')) {
      return {
        hanzi: '对不起',
        pinyin: 'duì bu qǐ',
        translation: 'Sorry',
        feedback: 'To say sorry, use 对不起 (duì bu qǐ). It\'s very polite! You can also say 不好意思 (bù hǎo yì si) for "excuse me". 加油!',
        emotion: 'study',
      };
    }

    // Love
    if (lowerMessage.includes('love') || lowerMessage.includes('我爱你')) {
      return {
        hanzi: '我爱你',
        pinyin: 'wǒ ài nǐ',
        translation: 'I love you',
        feedback: 'That\'s sweet! 我爱你 (wǒ ài nǐ) means I love you. A very important phrase! 💖 加油!',
        emotion: 'joy',
      };
    }

    // Water
    if (lowerMessage.includes('water') || lowerMessage.includes('drink') || lowerMessage.includes('水')) {
      return {
        hanzi: '水',
        pinyin: 'shuǐ',
        translation: 'Water',
        feedback: '水 (shuǐ) means water. To say "I want to drink water", say 我想喝水 (wǒ xiǎng hē shuǐ). Stay hydrated! 加油!',
        emotion: 'study',
      };
    }

    // Food/Eat
    if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('吃')) {
      return {
        hanzi: '吃饭',
        pinyin: 'chī fàn',
        translation: 'Eat/Have a meal',
        feedback: '吃饭 (chī fàn) means to eat or have a meal. 吃 (chī) = eat, 饭 (fàn) = rice/meal. Have you eaten? 你吃饭了吗？ 加油!',
        emotion: 'study',
      };
    }

    // Questions about learning
    if (lowerMessage.includes('how to learn') || lowerMessage.includes('study') || lowerMessage.includes('practice')) {
      return {
        hanzi: '学习',
        pinyin: 'xué xí',
        translation: 'Study/Learn',
        feedback: 'Great question! 学习 (xué xí) means to study. Practice every day, speak out loud, and don\'t be afraid of mistakes! 加油!',
        emotion: 'study',
      };
    }

    // Weather
    if (lowerMessage.includes('weather') || lowerMessage.includes('天气')) {
      return {
        hanzi: '天气',
        pinyin: 'tiān qì',
        translation: 'Weather',
        feedback: '天气 (tiān qì) means weather. To ask "How\'s the weather?" say 天气怎么样 (tiān qì zěn me yàng)? 加油!',
        emotion: 'study',
      };
    }

    // Default response for anything else
    return {
      hanzi: '加油',
      pinyin: 'jiā yóu',
      translation: 'Keep going! / You can do it!',
      feedback: 'That\'s interesting! Let me help you learn more Chinese. 加油 (jiā yóu) means "keep going!" - it\'s my favorite phrase! What would you like to learn? 加油!',
      emotion: 'thinking',
    };
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
