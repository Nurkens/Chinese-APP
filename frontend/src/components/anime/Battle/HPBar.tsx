/**
 * ❤️ HPBar Component
 *
 * Animated health bar with Genshin Impact style.
 * Includes glow effects, percentage display, and smooth transitions.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { HPBarConfig } from '../../../types/battle.types';
import { ANIME_THEME } from '../../../types/anime.types';

interface HPBarProps extends Partial<HPBarConfig> {
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

const HP_BAR_SIZES = {
  small: { height: 16, fontSize: 14 },
  medium: { height: 24, fontSize: 16 },
  large: { height: 32, fontSize: 18 },
};

const HPBar: React.FC<HPBarProps> = ({
  current = 100,
  max = 100,
  color = '#ED64A6',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  showPercentage = true,
  animated = true,
  glowEffect = true,
  label,
  size = 'medium',
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const sizeConfig = HP_BAR_SIZES[size];

  // Dynamic color based on HP percentage
  const getHPColor = () => {
    if (percentage > 60) return '#48BB78'; // Green
    if (percentage > 30) return '#ECC94B'; // Yellow
    return '#F56565'; // Red
  };

  const barColor = color === '#ED64A6' ? getHPColor() : color;

  return (
    <div style={{ width: '100%' }}>
      {/* Label */}
      {label && (
        <div
          style={{
            fontSize: sizeConfig.fontSize,
            color: ANIME_THEME.text.white,
            marginBottom: '8px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          {label}
        </div>
      )}

      {/* HP Bar Container */}
      <div style={{ position: 'relative' }}>
        {/* Background */}
        <div
          style={{
            width: '100%',
            height: `${sizeConfig.height}px`,
            backgroundColor,
            borderRadius: `${sizeConfig.height / 2}px`,
            overflow: 'hidden',
            border: `2px solid ${ANIME_THEME.primary.gold}`,
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
            position: 'relative',
          }}
        >
          {/* HP Fill */}
          <motion.div
            initial={animated ? { width: 0 } : { width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{
              duration: animated ? 0.5 : 0,
              ease: 'easeOut',
            }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${barColor}, ${barColor}DD)`,
              borderRadius: `${sizeConfig.height / 2}px`,
              position: 'relative',
              boxShadow: glowEffect ? `0 0 20px ${barColor}` : 'none',
            }}
          >
            {/* Shine effect */}
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                pointerEvents: 'none',
              }}
            />
          </motion.div>

          {/* Grid pattern overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 4px,
                  rgba(0, 0, 0, 0.1) 4px,
                  rgba(0, 0, 0, 0.1) 6px
                )
              `,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* HP Text */}
        {showPercentage && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '12px',
              transform: 'translateY(-50%)',
              fontSize: `${sizeConfig.fontSize - 2}px`,
              fontWeight: 'bold',
              color: ANIME_THEME.text.white,
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
              pointerEvents: 'none',
            }}
          >
            {current} / {max}
          </div>
        )}

        {/* Outer glow */}
        {glowEffect && (
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: `${sizeConfig.height / 2 + 4}px`,
              background: `radial-gradient(ellipse, ${barColor}33, transparent)`,
              pointerEvents: 'none',
              filter: 'blur(8px)',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default HPBar;
