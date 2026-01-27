/**
 * 😊 EmotionRenderer Component
 *
 * Handles emotion-based animations and particle effects.
 * Syncs with Live2D model expressions.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { EmotionType, EmotionConfig } from '../../../types/tutor.types';
import { ANIME_THEME } from '../../../types/anime.types';

interface EmotionRendererProps {
  emotion: EmotionType;
  onAnimationComplete?: () => void;
}

// Emotion configurations
const EMOTION_CONFIGS: Record<EmotionType, EmotionConfig> = {
  joy: {
    expression: 'happy',
    animation: 'bounce',
    duration: 1000,
    particleEffect: {
      type: 'hearts',
      color: '#ED64A6',
    },
  },
  study: {
    expression: 'focused',
    animation: 'glint',
    duration: 800,
    particleEffect: {
      type: 'sparkles',
      color: '#FFD700',
    },
  },
  surprised: {
    expression: 'surprised',
    animation: 'shake',
    duration: 600,
    particleEffect: {
      type: 'stars',
      color: '#4299E1',
    },
  },
  neutral: {
    expression: 'default',
    animation: 'idle',
    duration: 0,
  },
  thinking: {
    expression: 'thinking',
    animation: 'idle',
    duration: 1200,
    particleEffect: {
      type: 'sparkles',
      color: '#9F7AEA',
    },
  },
};

// Animation variants for Framer Motion
const ANIMATION_VARIANTS = {
  bounce: {
    initial: { y: 0 },
    animate: {
      y: [0, -20, 0, -10, 0],
      transition: {
        duration: 1,
        times: [0, 0.3, 0.5, 0.7, 1],
        ease: 'easeOut',
      },
    },
  },
  shake: {
    initial: { x: 0, rotate: 0 },
    animate: {
      x: [-5, 5, -5, 5, 0],
      rotate: [-2, 2, -2, 2, 0],
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  },
  glint: {
    initial: { scale: 1, opacity: 0 },
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0, 1, 0],
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
      },
    },
  },
  idle: {
    initial: { y: 0 },
    animate: {
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
};

// Particle component
const Particle: React.FC<{
  type: 'hearts' | 'stars' | 'sparkles';
  color: string;
  delay: number;
}> = ({ type, color, delay }) => {
  const getParticleIcon = () => {
    switch (type) {
      case 'hearts':
        return '💖';
      case 'stars':
        return '⭐';
      case 'sparkles':
        return '✨';
      default:
        return '✨';
    }
  };

  const randomX = Math.random() * 400 - 200;
  const randomRotate = Math.random() * 360;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 0,
        x: randomX,
        scale: 0,
        rotate: 0,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: -200,
        scale: [0, 1.5, 1, 0.5],
        rotate: randomRotate,
      }}
      transition={{
        duration: 2,
        delay,
        ease: 'easeOut',
      }}
      style={{
        position: 'absolute',
        fontSize: '32px',
        pointerEvents: 'none',
        filter: `drop-shadow(0 0 8px ${color})`,
      }}
    >
      {getParticleIcon()}
    </motion.div>
  );
};

const EmotionRenderer: React.FC<EmotionRendererProps> = ({
  emotion,
  onAnimationComplete,
}) => {
  const [showParticles, setShowParticles] = useState(false);
  const config = EMOTION_CONFIGS[emotion];

  useEffect(() => {
    if (config.particleEffect) {
      setShowParticles(true);
      const timer = setTimeout(() => {
        setShowParticles(false);
        onAnimationComplete?.();
      }, config.duration + 2000); // Particle animation + cleanup

      return () => clearTimeout(timer);
    } else {
      onAnimationComplete?.();
    }
  }, [emotion, config.duration, config.particleEffect, onAnimationComplete]);

  const animationVariant = ANIMATION_VARIANTS[config.animation];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {/* Emotion-based overlay animation */}
      {config.animation !== 'idle' && (
        <motion.div
          key={emotion}
          variants={animationVariant}
          initial="initial"
          animate="animate"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Particle effects */}
      {showParticles && config.particleEffect && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Particle
              key={i}
              type={config.particleEffect!.type}
              color={config.particleEffect!.color}
              delay={i * 0.15}
            />
          ))}
        </div>
      )}

      {/* Glasses glint effect for 'study' emotion */}
      {emotion === 'study' && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: [0, 1, 0], x: 100 }}
          transition={{ duration: 0.8, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '30%',
            left: '40%',
            width: '200px',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, white, transparent)',
            transform: 'rotate(-30deg)',
            pointerEvents: 'none',
            filter: 'blur(2px)',
          }}
        />
      )}

      {/* Glow pulse for surprised emotion */}
      {emotion === 'surprised' && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ANIME_THEME.accent.blue}, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default EmotionRenderer;
