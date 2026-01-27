/**
 * 🤖 AITutor Component - Main Visual Novel Interface
 *
 * Combines Live2D stage, dialogue box, and emotion rendering.
 * Manages conversation flow with AI tutor.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DialogueBox from './DialogueBox';
import EmotionRenderer from './EmotionRenderer';
import Live2DStage from './Live2DStage';
import type { DialogueMessage, EmotionType, DynamicBackground } from '../../../types/tutor.types';
import type { TutorResponse } from '../../../types/tutor.types';
import { ANIME_THEME } from '../../../types/anime.types';

interface AITutorProps {
  userId: string;
  initialBackground?: DynamicBackground['type'];
  onClose?: () => void;
}

const AITutor: React.FC<AITutorProps> = ({
  userId,
  initialBackground = 'classroom',
  onClose,
}) => {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<DialogueMessage | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [background, setBackground] = useState(initialBackground);

  // Background image mapping
  const backgroundImages: Record<DynamicBackground['type'], string> = {
    classroom: '/assets/backgrounds/classroom.jpg',
    library: '/assets/backgrounds/library.jpg',
    garden: '/assets/backgrounds/garden.jpg',
    city: '/assets/backgrounds/city.jpg',
    night_sky: '/assets/backgrounds/night_sky.jpg',
    traditional_room: '/assets/backgrounds/traditional_room.jpg',
  };

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: DialogueMessage = {
      id: 'welcome',
      speaker: 'tutor',
      content: '你好! I\'m 小美 (Xiǎo Měi), your Chinese learning companion! Ready to practice some Chinese today?',
      emotion: 'joy',
      timestamp: new Date(),
    };

    setCurrentMessage(welcomeMessage);
    setMessages([welcomeMessage]);
    setCurrentEmotion('joy');
  }, []);

  // Send message to AI tutor backend
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: DialogueMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await tutorAPI.chat({ userId, message });

      // Mock response for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockResponse: TutorResponse = {
        id: `tutor-${Date.now()}`,
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        translation: 'Hello',
        feedback: 'Great job! You\'re making excellent progress. Let\'s practice some more words!',
        emotion: 'joy',
        timestamp: new Date(),
      };

      // Create dialogue message from tutor response
      const tutorMessage: DialogueMessage = {
        id: mockResponse.id,
        speaker: 'tutor',
        content: mockResponse.feedback,
        hanzi: mockResponse.hanzi,
        pinyin: mockResponse.pinyin,
        translation: mockResponse.translation,
        emotion: mockResponse.emotion,
        timestamp: mockResponse.timestamp,
      };

      setMessages((prev) => [...prev, tutorMessage]);
      setCurrentMessage(tutorMessage);
      setCurrentEmotion(mockResponse.emotion);
    } catch (error) {
      console.error('Failed to send message:', error);

      const errorMessage: DialogueMessage = {
        id: `error-${Date.now()}`,
        speaker: 'tutor',
        content: 'Oops! I had trouble processing that. Let\'s try again! 加油!',
        emotion: 'surprised',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setCurrentMessage(errorMessage);
      setCurrentEmotion('surprised');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(userInput);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: ANIME_THEME.background.dark,
        overflow: 'hidden',
      }}
    >
      {/* Dynamic background */}
      <motion.div
        key={background}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${backgroundImages[background]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(26, 14, 46, 0.3), rgba(26, 14, 46, 0.8))',
        }}
      />

      {/* Main content grid */}
      <div
        style={{
          position: 'relative',
          height: '100vh',
          display: 'grid',
          gridTemplateRows: '1fr auto',
          padding: '40px',
          gap: '40px',
        }}
      >
        {/* Top section: Live2D Stage */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Live2D Model - Replace with actual model path */}
          <div style={{ position: 'relative' }}>
            {/* For now, placeholder for Live2D */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                width: '600px',
                height: '600px',
                background: 'rgba(255, 215, 0, 0.05)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '200px',
                border: `2px solid ${ANIME_THEME.primary.gold}`,
                boxShadow: '0 0 60px rgba(255, 215, 0, 0.3)',
              }}
            >
              🌸
            </motion.div>

            {/* Emotion Renderer overlay */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <EmotionRenderer emotion={currentEmotion} />
            </div>

            {/*
            TODO: Replace placeholder with actual Live2D component
            <Live2DStage
              modelPath="/assets/models/xiaomei/xiaomei.model3.json"
              emotion={currentEmotion}
              scale={0.5}
              position={{ x: 0, y: 50 }}
            />
            */}
          </div>
        </div>

        {/* Bottom section: Dialogue & Input */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Dialogue Box */}
          <AnimatePresence mode="wait">
            {currentMessage && (
              <DialogueBox
                message={currentMessage}
                config={{
                  speed: 40,
                  skipOnClick: true,
                }}
              />
            )}
          </AnimatePresence>

          {/* Input Box */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoading}
              placeholder="Type your message in Chinese or English..."
              style={{
                flex: 1,
                padding: '20px 28px',
                fontSize: '18px',
                background: ANIME_THEME.background.card,
                backdropFilter: 'blur(20px)',
                border: `2px solid ${ANIME_THEME.primary.gold}`,
                borderRadius: '16px',
                color: ANIME_THEME.text.white,
                outline: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            />

            <motion.button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '20px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: isLoading || !userInput.trim()
                  ? ANIME_THEME.text.gray
                  : `linear-gradient(135deg, ${ANIME_THEME.primary.gold}, ${ANIME_THEME.primary.lightGold})`,
                color: ANIME_THEME.background.dark,
                border: 'none',
                borderRadius: '16px',
                cursor: isLoading || !userInput.trim() ? 'not-allowed' : 'pointer',
                boxShadow: isLoading || !userInput.trim()
                  ? 'none'
                  : '0 4px 20px rgba(212, 175, 55, 0.4)',
              }}
            >
              {isLoading ? '⏳ Thinking...' : '📤 Send'}
            </motion.button>
          </motion.form>
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: ANIME_THEME.background.card,
            backdropFilter: 'blur(20px)',
            border: `2px solid ${ANIME_THEME.primary.gold}`,
            color: ANIME_THEME.primary.lightGold,
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          ✕
        </motion.button>
      )}
    </div>
  );
};

export default AITutor;

/**
 * USAGE EXAMPLE:
 *
 * import AITutor from './components/anime/AITutor/AITutor';
 *
 * function Dashboard() {
 *   const [showTutor, setShowTutor] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setShowTutor(true)}>
 *         Talk to 小美
 *       </button>
 *
 *       {showTutor && (
 *         <AITutor
 *           userId={currentUser.id}
 *           initialBackground="classroom"
 *           onClose={() => setShowTutor(false)}
 *         />
 *       )}
 *     </>
 *   );
 * }
 */
