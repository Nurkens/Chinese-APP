/**
 * ✍️ HanziWriter Component
 *
 * Traditional calligraphy practice with anime particle effects.
 * Uses hanzi-writer library for stroke order detection.
 *
 * SETUP:
 * npm install hanzi-writer
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HanziDrawingResult } from '../../../types/battle.types';
import { ANIME_THEME } from '../../../types/anime.types';

interface HanziWriterProps {
  character: string;
  onComplete?: (result: HanziDrawingResult) => void;
  showHints?: boolean;
  showOutline?: boolean;
  size?: number;
}

const HanziWriter: React.FC<HanziWriterProps> = ({
  character,
  onComplete,
  showHints = true,
  showOutline = true,
  size = 400,
}) => {
  const writerRef = useRef<HTMLDivElement>(null);
  const [hanziWriter, setHanziWriter] = useState<any>(null);
  const [strokesCorrect, setStrokesCorrect] = useState(0);
  const [strokesTotal, setStrokesTotal] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [startTime] = useState(Date.now());

  // Initialize HanziWriter
  useEffect(() => {
    if (!writerRef.current) return;

    const initWriter = async () => {
      try {
        // Dynamically import hanzi-writer
        const HanziWriter = (await import('hanzi-writer')).default;

        // Clear any existing content
        writerRef.current!.innerHTML = '';

        // Create new writer instance
        const writer = HanziWriter.create(writerRef.current!, character, {
          width: size,
          height: size,
          padding: 20,
          strokeColor: ANIME_THEME.primary.gold,
          outlineColor: showOutline ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0)',
          showCharacter: false, // Don't show character initially
          showOutline: showOutline,
          drawingWidth: 30,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 200,
        });

        setHanziWriter(writer);

        // Get stroke count
        const strokes = writer._character.strokes || [];
        setStrokesTotal(strokes.length);

        // Quiz mode - user draws
        writer.quiz({
          onMistake: (strokeData: any) => {
            console.log('Mistake on stroke:', strokeData);
            // Show red flash animation
            createParticles(strokeData.x || size / 2, strokeData.y || size / 2, '#F56565', false);
          },
          onCorrectStroke: (strokeData: any) => {
            console.log('Correct stroke:', strokeData);
            setStrokesCorrect((prev) => prev + 1);
            // Show gold particle burst
            createParticles(strokeData.x || size / 2, strokeData.y || size / 2, ANIME_THEME.primary.lightGold, true);
          },
          onComplete: (summaryData: any) => {
            console.log('Drawing complete:', summaryData);
            setIsComplete(true);

            const timeSpent = (Date.now() - startTime) / 1000; // seconds
            const accuracy = (summaryData.totalMistakes === 0 ? 100 : Math.max(0, 100 - (summaryData.totalMistakes * 10)));

            const result: HanziDrawingResult = {
              character,
              accuracy,
              strokesCorrect: summaryData.totalStrokes - summaryData.totalMistakes,
              strokesTotal: summaryData.totalStrokes,
              timeSpent,
              perfectStrokes: [], // TODO: Track which strokes were perfect
            };

            // Celebration animation
            createFireworks();

            setTimeout(() => {
              onComplete?.(result);
            }, 2000);
          },
        });

        // Show character animation initially
        writer.animateCharacter();
      } catch (error) {
        console.error('Failed to initialize HanziWriter:', error);
      }
    };

    initWriter();

    return () => {
      if (hanziWriter) {
        // Cleanup
      }
    };
  }, [character, size, showOutline]);

  // Create particle effects
  const createParticles = useCallback((x: number, y: number, color: string, isSuccess: boolean) => {
    const particleCount = isSuccess ? 12 : 5;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
    }));
    setParticles((prev) => [...prev, ...newParticles]);

    // Remove particles after animation
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1500);
  }, []);

  // Fireworks for completion
  const createFireworks = useCallback(() => {
    const centerX = size / 2;
    const centerY = size / 2;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        createParticles(centerX, centerY, ANIME_THEME.primary.lightGold, true);
      }, i * 300);
    }
  }, [size, createParticles]);

  // Show hint (animate next stroke)
  const showHint = useCallback(() => {
    if (hanziWriter) {
      hanziWriter.animateStroke(strokesCorrect);
    }
  }, [hanziWriter, strokesCorrect]);

  // Reset drawing
  const reset = useCallback(() => {
    if (hanziWriter) {
      hanziWriter.cancelQuiz();
      hanziWriter.quiz();
      setStrokesCorrect(0);
      setIsComplete(false);
      setParticles([]);
    }
  }, [hanziWriter]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {/* Traditional paper background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(0deg, transparent 24%, rgba(255, 215, 0, 0.05) 25%, rgba(255, 215, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 215, 0, 0.05) 75%, rgba(255, 215, 0, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255, 215, 0, 0.05) 25%, rgba(255, 215, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 215, 0, 0.05) 75%, rgba(255, 215, 0, 0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
          borderRadius: '16px',
          border: `4px solid ${ANIME_THEME.primary.gold}`,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 0 40px rgba(255, 215, 0, 0.1)
          `,
          zIndex: 0,
        }}
      />

      {/* Red grid lines (like traditional practice paper) */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
        width={size}
        height={size}
      >
        <line
          x1={size / 2}
          y1="0"
          x2={size / 2}
          y2={size}
          stroke="rgba(255, 100, 100, 0.2)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1="0"
          y1={size / 2}
          x2={size}
          y2={size / 2}
          stroke="rgba(255, 100, 100, 0.2)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>

      {/* HanziWriter canvas */}
      <div
        ref={writerRef}
        style={{
          position: 'relative',
          zIndex: 2,
          width: `${size}px`,
          height: `${size}px`,
        }}
      />

      {/* Particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: particle.x + (Math.random() - 0.5) * 100,
              y: particle.y + (Math.random() - 0.5) * 100,
              opacity: 0,
              scale: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: ANIME_THEME.primary.lightGold,
              boxShadow: `0 0 20px ${ANIME_THEME.primary.lightGold}`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginTop: '20px',
          background: ANIME_THEME.background.card,
          borderRadius: '16px',
          padding: '20px',
          border: `2px solid ${ANIME_THEME.primary.gold}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            color: ANIME_THEME.text.white,
            fontSize: '16px',
          }}
        >
          <span>Strokes: {strokesCorrect} / {strokesTotal}</span>
          <span>{strokesTotal > 0 ? Math.round((strokesCorrect / strokesTotal) * 100) : 0}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{
              width: `${strokesTotal > 0 ? (strokesCorrect / strokesTotal) * 100 : 0}%`,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${ANIME_THEME.primary.gold}, ${ANIME_THEME.primary.lightGold})`,
              boxShadow: `0 0 20px ${ANIME_THEME.primary.gold}`,
            }}
          />
        </div>
      </motion.div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        {showHints && !isComplete && (
          <motion.button
            onClick={showHint}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: ANIME_THEME.accent.blue,
              color: ANIME_THEME.text.white,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            💡 Show Hint
          </motion.button>
        )}
        <motion.button
          onClick={reset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            flex: 1,
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: ANIME_THEME.accent.purple,
            color: ANIME_THEME.text.white,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          🔄 Reset
        </motion.button>
      </div>

      {/* Completion message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: ANIME_THEME.background.card,
            backdropFilter: 'blur(20px)',
            padding: '40px',
            borderRadius: '24px',
            border: `3px solid ${ANIME_THEME.primary.lightGold}`,
            textAlign: 'center',
            zIndex: 20,
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.6)',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: ANIME_THEME.primary.lightGold,
              marginBottom: '12px',
            }}
          >
            Perfect!
          </div>
          <div style={{ fontSize: '18px', color: ANIME_THEME.text.white }}>
            You've mastered {character}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HanziWriter;

/**
 * USAGE EXAMPLE:
 *
 * import HanziWriter from './components/anime/HanziPractice/HanziWriter';
 *
 * function PracticePage() {
 *   const handleComplete = (result: HanziDrawingResult) => {
 *     console.log('Drawing result:', result);
 *     // Award points, update progress, etc.
 *   };
 *
 *   return (
 *     <HanziWriter
 *       character="人"
 *       onComplete={handleComplete}
 *       showHints={true}
 *       showOutline={true}
 *       size={400}
 *     />
 *   );
 * }
 */
