import React, { createContext, useContext, useState, useCallback } from 'react';

type MessageType =
  | 'welcome'
  | 'tab:menu'
  | 'tab:scroll'
  | 'tab:review'
  | 'tab:goals'
  | 'tab:friends'
  | 'tab:profile'
  | 'tab:hanzi'
  | 'tab:adaptive'
  | 'review:complete'
  | 'word:learned'
  | 'streak:updated'
  | 'idle';

interface XiaomeiContextType {
  currentMessage: string;
  showMessage: (type: MessageType, vars?: Record<string, string | number>) => void;
}

const XiaomeiContext = createContext<XiaomeiContextType | undefined>(undefined);

const XIAOMEI_PHRASES: Record<MessageType, string[]> = {
  'welcome': [
    'Welcome back, {name}! Ready to master some Hanzi today?',
    'Great to see you, {name}! Let\'s make today count.',
    '{name}, your journey continues! 加油!',
  ],
  'tab:menu': [
    'This is your command center. Check your progress!',
    'A new day, a new character to learn. Let\'s go!',
    'Consistency beats intensity. You\'re doing great!',
  ],
  'tab:scroll': [
    'Focus is the key to memory. Let\'s look at these characters.',
    'Each character tells a story. Take your time.',
    'Try to spot radicals — they\'re the building blocks of Hanzi!',
  ],
  'tab:review': [
    'Review time! Remember: spaced repetition is your superpower.',
    'Don\'t rush. Quality over speed wins the race.',
    'If you forget, that\'s OK. Each recall makes you stronger.',
  ],
  'tab:goals': [
    'Setting goals is the first step to greatness!',
    'Small consistent goals > big sporadic efforts.',
    'Look how far you\'ve come already!',
  ],
  'tab:friends': [
    'Learning with friends makes everything more fun!',
    'A little competition keeps you sharp 😊',
    'Share your tag and grow your study circle!',
  ],
  'tab:profile': [
    'Looking good! Your stats tell a great story.',
    'Every number here represents real effort. Be proud!',
  ],
  'tab:hanzi': [
    'Hanzi practice! Muscle memory is key to mastery.',
    'Draw and feel the characters come alive! 🖌️',
    'Each stroke tells a story. Write with intention!',
  ],
  'tab:adaptive': [
    'Your personalized learning path! I analyzed your performance to optimize your studying.',
    'AI-powered recommendations just for you based on the forgetting curve! 🧠',
    'Let\'s focus on what matters most for your progress.',
  ],
  'review:complete': [
    'Amazing work! Your {streak}-day streak is safe with me! ✨',
    'Brilliant session! You\'re building something real. ✨',
    'Wonderful! Your brain just got stronger! ✨',
  ],
  'word:learned': [
    'New word unlocked! Every character is a key to understanding.',
    'One more word in your arsenal! Keep it up!',
  ],
  'streak:updated': [
    '{streak} days strong! Don\'t break the chain!',
    'Streak +1! You\'re on fire 🔥',
  ],
  idle: [
    'Did you know? Chinese has over 80,000 characters, but you only need ~3,000 for daily life.',
    'Tip: Try writing characters by hand — it boosts memory by 40%!',
    'Fun fact: 人 (person) is one of the oldest Chinese characters, over 3,000 years old.',
    'The character 休 (rest) shows a person (人) leaning against a tree (木). Beautiful, right?',
    'Tip: Review right before sleep — your brain consolidates memories overnight!',
    'In Chinese, "crisis" (危机) combines "danger" (危) and "opportunity" (机).',
    'Tip: Group characters by radical — it makes patterns easier to spot!',
    'Practice makes progress, not perfection. Keep going!',
  ],
};

export const XiaomeiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMessage, setCurrentMessage] = useState('');

  const getRandomPhrase = (phrases: string[]): string => {
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const interpolate = (text: string, vars?: Record<string, string | number>): string => {
    if (!vars) return text;
    let result = text;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(`{${key}}`, String(value));
    });
    return result;
  };

  const showMessage = useCallback((type: MessageType, vars?: Record<string, string | number>) => {
    const phrases = XIAOMEI_PHRASES[type] || XIAOMEI_PHRASES.idle;
    const randomPhrase = getRandomPhrase(phrases);
    const finalMessage = interpolate(randomPhrase, vars);
    setCurrentMessage(finalMessage);
  }, []);

  return (
    <XiaomeiContext.Provider value={{ currentMessage, showMessage }}>
      {children}
    </XiaomeiContext.Provider>
  );
};

export const useXiaomei = () => {
  const context = useContext(XiaomeiContext);
  if (!context) {
    throw new Error('useXiaomei must be used within XiaomeiProvider');
  }
  return context;
};
