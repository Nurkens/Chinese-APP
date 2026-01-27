/**
 * 🎭 Live2DStage Component - Placeholder Version
 *
 * Simple placeholder for Live2D character display.
 * Shows animated emoji until pixi-live2d-display is installed.
 *
 * TO ENABLE LIVE2D:
 * 1. npm install pixi-live2d-display --legacy-peer-deps
 * 2. Replace this file with the full Live2D implementation
 * 3. Add .model3.json files to /public/assets/models/
 */

import React from 'react';
import type { EmotionType } from '../../../types/tutor.types';

interface Live2DStageProps {
  modelPath: string;
  emotion: EmotionType;
  scale?: number;
  position?: { x: number; y: number };
  onModelLoad?: () => void;
  onError?: (error: string) => void;
}

const Live2DStage: React.FC<Live2DStageProps> = ({
  emotion,
}) => {
  // Emotion to emoji mapping
  const emotionEmojis: Record<EmotionType, string> = {
    joy: '😊',
    study: '🤓',
    surprised: '😲',
    neutral: '😌',
    thinking: '🤔',
  };

  const currentEmoji = emotionEmojis[emotion];

  return (
    <div
      style={{
        position: 'relative',
        width: '400px',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(159, 122, 234, 0.1), rgba(237, 100, 166, 0.1))',
        borderRadius: '24px',
        border: '2px solid rgba(212, 175, 55, 0.3)',
      }}
    >
      {/* Animated character placeholder */}
      <div
        style={{
          fontSize: '180px',
          animation: 'float 3s ease-in-out infinite',
          textAlign: 'center',
        }}
      >
        {currentEmoji}
      </div>

      {/* Floating name tag */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          background: 'rgba(26, 14, 46, 0.9)',
          color: '#FFD700',
          padding: '12px 24px',
          borderRadius: '12px',
          border: '2px solid #D4AF37',
          fontSize: '18px',
          fontWeight: 'bold',
        }}
      >
        小美 (Xiǎo měi)
      </div>

      {/* Live2D placeholder notice */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(26, 14, 46, 0.8)',
          color: '#9F7AEA',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          border: '1px solid rgba(159, 122, 234, 0.5)',
        }}
      >
        Live2D placeholder - Install pixi-live2d-display for full model
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default Live2DStage;

/**
 * TO ENABLE FULL LIVE2D:
 *
 * 1. Install package:
 *    npm install pixi-live2d-display --legacy-peer-deps
 *
 * 2. Get Live2D models:
 *    - Download from: https://www.live2d.com/en/download/sample-data/
 *    - Place in /public/assets/models/xiaomei/
 *
 * 3. Replace this placeholder with full implementation
 *    See: ANIME_ARCHITECTURE.md for details
 */
