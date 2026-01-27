/**
 * 💬 DialogueBox Component
 *
 * Semi-transparent dialogue box with typewriter effect.
 * Genshin Impact / Visual Novel style.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DialogueMessage, TypewriterConfig } from '../../../types/tutor.types';
import { ANIME_THEME } from '../../../types/anime.types';

interface DialogueBoxProps {
  message: DialogueMessage | null;
  config?: Partial<TypewriterConfig>;
  onComplete?: () => void;
  className?: string;
}

const defaultConfig: TypewriterConfig = {
  speed: 30, // Characters per second
  delay: 200, // Initial delay
  pauseOnPunctuation: 300, // Pause on ,.!?
  skipOnClick: true,
};

const DialogueBox: React.FC<DialogueBoxProps> = ({
  message,
  config = {},
  onComplete,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const mergedConfig = { ...defaultConfig, ...config };

  // Typewriter effect logic
  useEffect(() => {
    if (!message) {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsTyping(false);
      return;
    }

    const text = message.content;
    setIsTyping(true);
    setCurrentIndex(0);
    setDisplayedText('');

    const startTime = Date.now();
    const totalDelay = mergedConfig.delay;

    const typeNextCharacter = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < totalDelay) {
        requestAnimationFrame(typeNextCharacter);
        return;
      }

      setCurrentIndex((prevIndex) => {
        if (prevIndex >= text.length) {
          setIsTyping(false);
          onComplete?.();
          return prevIndex;
        }

        const char = text[prevIndex];
        const nextIndex = prevIndex + 1;

        setDisplayedText(text.substring(0, nextIndex));

        // Calculate delay for next character
        const isPunctuation = /[,.!?;:。,!?;:]/.test(char);
        const charDelay = isPunctuation
          ? mergedConfig.pauseOnPunctuation
          : 1000 / mergedConfig.speed;

        setTimeout(() => {
          requestAnimationFrame(typeNextCharacter);
        }, charDelay);

        return nextIndex;
      });
    };

    requestAnimationFrame(typeNextCharacter);

    return () => {
      setIsTyping(false);
    };
  }, [message?.id]); // Only re-run when message changes

  // Skip typewriter on click
  const handleSkip = useCallback(() => {
    if (mergedConfig.skipOnClick && isTyping && message) {
      setDisplayedText(message.content);
      setCurrentIndex(message.content.length);
      setIsTyping(false);
      onComplete?.();
    }
  }, [isTyping, message, mergedConfig.skipOnClick, onComplete]);

  if (!message) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`dialogue-box ${className}`}
        onClick={handleSkip}
        style={{
          position: 'relative',
          background: ANIME_THEME.background.card,
          backdropFilter: 'blur(20px)',
          border: `2px solid ${ANIME_THEME.primary.gold}`,
          borderRadius: '24px',
          padding: '32px',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            inset 0 0 20px rgba(255, 215, 0, 0.1),
            0 0 40px rgba(212, 175, 55, 0.2)
          `,
          cursor: isTyping ? 'pointer' : 'default',
          maxWidth: '900px',
          minHeight: '200px',
        }}
      >
        {/* Decorative corner ornaments */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            width: '40px',
            height: '40px',
            borderTop: `4px solid ${ANIME_THEME.primary.lightGold}`,
            borderLeft: `4px solid ${ANIME_THEME.primary.lightGold}`,
            borderRadius: '24px 0 0 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '40px',
            height: '40px',
            borderTop: `4px solid ${ANIME_THEME.primary.lightGold}`,
            borderRight: `4px solid ${ANIME_THEME.primary.lightGold}`,
            borderRadius: '0 24px 0 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '-2px',
            width: '40px',
            height: '40px',
            borderBottom: `4px solid ${ANIME_THEME.primary.lightGold}`,
            borderLeft: `4px solid ${ANIME_THEME.primary.lightGold}`,
            borderRadius: '0 0 0 24px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '40px',
            height: '40px',
            borderBottom: `4px solid ${ANIME_THEME.primary.lightGold}`,
            borderRight: `4px solid ${ANIME_THEME.primary.lightGold}`,
            borderRadius: '0 0 24px 0',
          }}
        />

        {/* Speaker name */}
        {message.speaker === 'tutor' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: ANIME_THEME.primary.lightGold,
              marginBottom: '16px',
              textShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '32px' }}>🌸</span>
            小美 (Xiǎo Měi)
          </motion.div>
        )}

        {/* Main dialogue text */}
        <div
          style={{
            fontSize: '20px',
            lineHeight: '1.8',
            color: ANIME_THEME.text.white,
            marginBottom: message.hanzi ? '20px' : '0',
          }}
        >
          {displayedText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                display: 'inline-block',
                width: '8px',
                height: '24px',
                backgroundColor: ANIME_THEME.primary.gold,
                marginLeft: '4px',
                verticalAlign: 'middle',
              }}
            />
          )}
        </div>

        {/* Chinese character display (Hanzi, Pinyin, Translation) */}
        {message.hanzi && currentIndex >= message.content.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(255, 215, 0, 0.05)',
              borderRadius: '16px',
              border: `1px solid ${ANIME_THEME.primary.darkGold}`,
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: ANIME_THEME.primary.lightGold,
                textAlign: 'center',
                marginBottom: '8px',
                textShadow: '0 4px 12px rgba(255, 215, 0, 0.6)',
              }}
            >
              {message.hanzi}
            </div>
            {message.pinyin && (
              <div
                style={{
                  fontSize: '20px',
                  color: ANIME_THEME.accent.purple,
                  textAlign: 'center',
                  marginBottom: '8px',
                  fontStyle: 'italic',
                }}
              >
                {message.pinyin}
              </div>
            )}
            {message.translation && (
              <div
                style={{
                  fontSize: '18px',
                  color: ANIME_THEME.text.gray,
                  textAlign: 'center',
                }}
              >
                {message.translation}
              </div>
            )}
          </motion.div>
        )}

        {/* Skip indicator */}
        {isTyping && mergedConfig.skipOnClick && (
          <motion.div
            animate={{ opacity: [0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '24px',
              fontSize: '14px',
              color: ANIME_THEME.text.gray,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>👆</span>
            Click to skip
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default DialogueBox;
