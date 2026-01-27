/**
 * 💥 DamageNumber Component
 *
 * Floating damage numbers with critical hit animations.
 * Inspired by RPG combat feedback.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DamageAnimation } from '../../../types/battle.types';

interface DamageNumberProps {
  damage: DamageAnimation;
  onComplete?: () => void;
}

const DamageNumber: React.FC<DamageNumberProps> = ({ damage, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getAnimationConfig = () => {
    switch (damage.type) {
      case 'critical':
        return {
          fontSize: 64 * damage.scale,
          color: '#FFD700',
          shadow: '0 0 30px #FFD700',
          y: -150,
          rotate: [0, -15, 15, 0],
          scale: [1, 1.5, 1.2],
        };
      case 'damage':
        return {
          fontSize: 48 * damage.scale,
          color: damage.color,
          shadow: `0 0 20px ${damage.color}`,
          y: -100,
          rotate: 0,
          scale: [1, 1.2, 1],
        };
      case 'heal':
        return {
          fontSize: 42 * damage.scale,
          color: '#48BB78',
          shadow: '0 0 20px #48BB78',
          y: -80,
          rotate: 0,
          scale: [1, 1.1, 1],
        };
      case 'miss':
        return {
          fontSize: 36 * damage.scale,
          color: '#A0AEC0',
          shadow: 'none',
          y: -60,
          rotate: 0,
          scale: 1,
        };
      default:
        return {
          fontSize: 48,
          color: '#FFF',
          shadow: 'none',
          y: -100,
          rotate: 0,
          scale: 1,
        };
    }
  };

  const config = getAnimationConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 1,
            y: 0,
            x: 0,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            y: config.y,
            x: [0, Math.random() * 40 - 20],
            scale: config.scale,
            rotate: config.rotate,
          }}
          exit={{
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            left: `${damage.position.x}px`,
            top: `${damage.position.y}px`,
            fontSize: `${config.fontSize}px`,
            fontWeight: 'bold',
            color: config.color,
            textShadow: config.shadow,
            pointerEvents: 'none',
            zIndex: 100,
            textStroke: '2px #000',
            WebkitTextStroke: '2px #000',
            fontFamily: 'Impact, sans-serif',
          }}
        >
          {damage.type === 'miss' ? 'MISS!' : damage.type === 'heal' ? `+${damage.value}` : damage.value}

          {damage.type === 'critical' && (
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0],
              }}
              transition={{
                duration: 0.8,
              }}
              style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '24px',
                color: '#FFD700',
                textShadow: '0 0 20px #FFD700',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ CRITICAL! ⚡
            </motion.div>
          )}

          {/* Particle burst for critical hits */}
          {damage.type === 'critical' && (
            <>
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 60;
                return (
                  <motion.div
                    key={i}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: [1, 0],
                      scale: [1, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeOut',
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#FFD700',
                      boxShadow: '0 0 10px #FFD700',
                    }}
                  />
                );
              })}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DamageNumber;
