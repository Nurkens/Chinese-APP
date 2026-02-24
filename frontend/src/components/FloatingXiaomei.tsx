import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutor, TutorTrigger } from '../contexts/TutorContext';

// ── Dialogue Map ──────────────────────────────────────────────
const DIALOGUE: Record<TutorTrigger, string[]> = {
  login: [
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

let lastPicked: Record<string, number> = {};

function pickDialogue(trigger: TutorTrigger, name: string, streak: number): string {
  const pool = DIALOGUE[trigger] || DIALOGUE.idle;
  // Avoid repeating the same phrase
  let idx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && lastPicked[trigger] === idx) {
    idx = (idx + 1) % pool.length;
  }
  lastPicked[trigger] = idx;
  const text = pool[idx];
  return text.replace('{name}', name || 'Warrior').replace('{streak}', String(streak));
}

// ── Sparkle Particles ─────────────────────────────────────────
const Sparkle: React.FC<{ delay: number }> = ({ delay }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full bg-amber-400"
    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1.2, 0],
      x: [0, (Math.random() - 0.5) * 60],
      y: [0, -30 - Math.random() * 40],
    }}
    transition={{ duration: 1.2, delay, ease: 'easeOut' }}
  />
);

// ── Typewriter Hook ───────────────────────────────────────────
function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

// ── Main Component ────────────────────────────────────────────
const FloatingXiaomei: React.FC = () => {
  const { event, username, streak } = useTutor();
  const [message, setMessage] = useState('');
  const [showBubble, setShowBubble] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { displayed, done } = useTypewriter(message, 25);

  // React to trigger changes (event.key ensures even same trigger re-fires)
  useEffect(() => {
    if (event.trigger === 'idle') return; // idle handled separately
    const text = pickDialogue(event.trigger, username, streak);
    setMessage(text);
    setShowBubble(true);

    // Sparkle on achievements
    if (['review:complete', 'word:learned', 'streak:updated'].includes(event.trigger)) {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1500);
    }

    // Auto-hide bubble after 8s
    const hideTimer = setTimeout(() => setShowBubble(false), 8000);

    // Reset idle timer
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      const idleText = pickDialogue('idle', username, streak);
      setMessage(idleText);
      setShowBubble(true);
    }, 45000); // idle after 45s of no triggers

    return () => {
      clearTimeout(hideTimer);
    };
  }, [event, username, streak]);

  // Initial idle cycle
  useEffect(() => {
    idleTimer.current = setTimeout(() => {
      const idleText = pickDialogue('idle', username, streak);
      setMessage(idleText);
      setShowBubble(true);
    }, 30000);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  const handleCharacterClick = useCallback(() => {
    if (minimized) {
      setMinimized(false);
      setShowBubble(true);
      return;
    }
    // Toggle bubble
    if (showBubble) {
      setShowBubble(false);
    } else {
      // Show a new idle message
      const text = pickDialogue('idle', username, streak);
      setMessage(text);
      setShowBubble(true);
    }
  }, [minimized, showBubble, username, streak]);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none max-w-xs sm:max-w-sm">
      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto relative mr-4"
          >
            <div className="bg-stone-900/80 backdrop-blur-xl rounded-2xl p-4 border border-amber-700/30 shadow-2xl max-w-[260px]">
              {/* Name tag */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-500 text-xs font-medium tracking-wide">XIAOMEI · 小美</span>
              </div>
              {/* Message */}
              <p className="text-stone-200 text-sm leading-relaxed">
                {displayed}
                {!done && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="inline-block w-0.5 h-4 bg-amber-400 ml-0.5 align-middle"
                  />
                )}
              </p>
            </div>
            {/* Bubble tail */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-stone-900/80 border-r border-b border-amber-700/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Container */}
      <motion.div
        className="pointer-events-auto relative cursor-pointer select-none"
        onClick={handleCharacterClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Sparkle particles */}
        <AnimatePresence>
          {showSparkles && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, i) => (
                <Sparkle key={i} delay={i * 0.1} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Glow ring */}
        <motion.div
          className="absolute -inset-2 rounded-full bg-amber-500/20 blur-xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        />

        {/* Floating animation wrapper */}
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [0, 1, 0, -1, 0],
          }}
          transition={{
            y: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
            rotate: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
          }}
        >
          {/* Character image */}
          <div className={`relative transition-all duration-300 ${minimized ? 'w-16 h-16' : 'w-44 h-44 sm:w-52 sm:h-52'}`}>
            <img
              src="/xiaomei.png"
              alt="Xiaomei - AI Tutor"
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(217,119,6,0.3)]"
              draggable={false}
            />

            {/* Blink overlay — simulates blink */}
            <motion.div
              className="absolute top-[22%] left-[38%] w-[24%] h-[3%] bg-stone-900/0 rounded-full"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{
                repeat: Infinity,
                repeatDelay: 4,
                duration: 0.15,
                times: [0, 0.5, 1],
              }}
            />
          </div>
        </motion.div>

        {/* Minimized indicator dot */}
        {minimized && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.div>

      {/* Minimize button */}
      {!minimized && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(true);
            setShowBubble(false);
          }}
          className="pointer-events-auto text-stone-500 hover:text-stone-300 text-xs transition-colors mr-2"
        >
          minimize
        </button>
      )}
    </div>
  );
};

export default FloatingXiaomei;
