/**
 * 🎰 GachaSystem Component
 *
 * Complete gacha/wish system with pull animations, card reveals, and pity tracking.
 * Genshin Impact / Honkai Star Rail style.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CharacterCard, PullResult, PityState } from '../../../types/gacha.types';
import { ANIME_THEME } from '../../../types/anime.types';

interface GachaSystemProps {
  userId: string;
  spiritStones: number;
  pityState: PityState;
  onPull: (pullType: 'single' | 'ten') => Promise<PullResult>;
  onClose?: () => void;
}

const SINGLE_PULL_COST = 160;
const TEN_PULL_COST = 1600;

const GachaSystem: React.FC<GachaSystemProps> = ({
  userId,
  spiritStones,
  pityState,
  onPull,
  onClose,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullResult, setPullResult] = useState<PullResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [animationStage, setAnimationStage] = useState<'idle' | 'pulling' | 'revealing' | 'complete'>('idle');

  const canAffordSingle = spiritStones >= SINGLE_PULL_COST;
  const canAffordTen = spiritStones >= TEN_PULL_COST;

  // Handle pull animation sequence
  const handlePull = useCallback(async (pullType: 'single' | 'ten') => {
    if (isPulling) return;

    const cost = pullType === 'single' ? SINGLE_PULL_COST : TEN_PULL_COST;
    if (spiritStones < cost) return;

    setIsPulling(true);
    setAnimationStage('pulling');

    try {
      // Stage 1: Spirit stones fly animation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Stage 2: Gate appears
      setAnimationStage('revealing');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Fetch pull result from backend
      const result = await onPull(pullType);
      setPullResult(result);

      // Stage 3: Card reveal
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAnimationStage('complete');
      setShowResults(true);
    } catch (error) {
      console.error('Pull failed:', error);
      setAnimationStage('idle');
    } finally {
      setIsPulling(false);
    }
  }, [isPulling, spiritStones, onPull]);

  const handleReset = () => {
    setShowResults(false);
    setPullResult(null);
    setAnimationStage('idle');
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
      {/* Animated star background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${ANIME_THEME.background.dark}, #000)`,
        }}
      >
        {Array.from({ length: 100 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              background: '#FFD700',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', height: '100vh', padding: '40px' }}>
        {/* Header - Spirit Stones & Pity Counter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          {/* Spirit Stones Display */}
          <div
            style={{
              background: ANIME_THEME.background.card,
              backdropFilter: 'blur(20px)',
              padding: '16px 32px',
              borderRadius: '16px',
              border: `2px solid ${ANIME_THEME.primary.gold}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '32px' }}>💎</span>
            <div>
              <div style={{ fontSize: '14px', color: ANIME_THEME.text.gray }}>
                Spirit Stones
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: ANIME_THEME.primary.lightGold,
                }}
              >
                {spiritStones.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Pity Counter */}
          <div
            style={{
              background: ANIME_THEME.background.card,
              backdropFilter: 'blur(20px)',
              padding: '16px 32px',
              borderRadius: '16px',
              border: `2px solid ${pityState.pullsSinceLastSSR >= 80 ? ANIME_THEME.accent.purple : ANIME_THEME.primary.gold}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '14px', color: ANIME_THEME.text.gray, marginBottom: '8px' }}>
              Pity Counter (SSR)
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: pityState.pullsSinceLastSSR >= 80 ? ANIME_THEME.accent.purple : ANIME_THEME.text.white,
              }}
            >
              {pityState.pullsSinceLastSSR} / {pityState.guaranteedSSRAt}
            </div>
            {pityState.increasedRates && (
              <div style={{ fontSize: '12px', color: ANIME_THEME.accent.purple, marginTop: '4px' }}>
                ⚡ Soft Pity Active
              </div>
            )}
          </div>
        </motion.div>

        {/* Pull Animation Area */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '500px',
            position: 'relative',
          }}
        >
          <AnimatePresence mode="wait">
            {animationStage === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  textAlign: 'center',
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    fontSize: '200px',
                    marginBottom: '40px',
                  }}
                >
                  🎴
                </motion.div>
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: ANIME_THEME.primary.lightGold,
                    marginBottom: '16px',
                    textShadow: '0 4px 20px rgba(255, 215, 0, 0.5)',
                  }}
                >
                  Character Wish
                </div>
                <div style={{ fontSize: '20px', color: ANIME_THEME.text.gray }}>
                  Collect powerful character cards to enhance your learning!
                </div>
              </motion.div>
            )}

            {animationStage === 'pulling' && (
              <motion.div
                key="pulling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Spirit stones flying animation */}
                {Array.from({ length: 20 }).map((_, i) => {
                  const angle = (i / 20) * Math.PI * 2;
                  const radius = 200;
                  return (
                    <motion.div
                      key={i}
                      initial={{
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius,
                        scale: 1,
                        opacity: 1,
                      }}
                      animate={{
                        x: 0,
                        y: 0,
                        scale: 0,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 1,
                        delay: i * 0.05,
                        ease: 'easeIn',
                      }}
                      style={{
                        position: 'absolute',
                        fontSize: '32px',
                      }}
                    >
                      💎
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {animationStage === 'revealing' && (
              <motion.div
                key="revealing"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{
                  width: '400px',
                  height: '400px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${ANIME_THEME.primary.gold}, ${ANIME_THEME.primary.lightGold})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '120px',
                  boxShadow: '0 0 100px rgba(255, 215, 0, 0.8)',
                }}
              >
                ✨
              </motion.div>
            )}

            {animationStage === 'complete' && showResults && pullResult && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  width: '100%',
                  maxWidth: '1200px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: pullResult.cards.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                  }}
                >
                  {pullResult.cards.map((card, index) => (
                    <CardReveal key={card.id} card={card} delay={index * 0.2} />
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: pullResult.cards.length * 0.2 + 0.5 }}
                  onClick={handleReset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    marginTop: '40px',
                    padding: '16px 48px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    background: `linear-gradient(135deg, ${ANIME_THEME.primary.gold}, ${ANIME_THEME.primary.lightGold})`,
                    color: ANIME_THEME.background.dark,
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
                    width: '100%',
                  }}
                >
                  Wish Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pull Buttons */}
        {animationStage === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              gap: '24px',
              justifyContent: 'center',
              marginTop: '60px',
            }}
          >
            {/* Single Pull */}
            <motion.button
              onClick={() => handlePull('single')}
              disabled={!canAffordSingle || isPulling}
              whileHover={canAffordSingle ? { scale: 1.05, y: -5 } : {}}
              whileTap={canAffordSingle ? { scale: 0.95 } : {}}
              style={{
                padding: '24px 48px',
                fontSize: '22px',
                fontWeight: 'bold',
                background: canAffordSingle
                  ? `linear-gradient(135deg, ${ANIME_THEME.accent.blue}, ${ANIME_THEME.accent.purple})`
                  : ANIME_THEME.text.gray,
                color: ANIME_THEME.text.white,
                border: `2px solid ${canAffordSingle ? ANIME_THEME.primary.gold : ANIME_THEME.text.gray}`,
                borderRadius: '16px',
                cursor: canAffordSingle ? 'pointer' : 'not-allowed',
                boxShadow: canAffordSingle ? '0 8px 32px rgba(66, 153, 225, 0.4)' : 'none',
                minWidth: '250px',
              }}
            >
              <div>Wish x1</div>
              <div style={{ fontSize: '16px', marginTop: '8px', opacity: 0.9 }}>
                💎 {SINGLE_PULL_COST}
              </div>
            </motion.button>

            {/* Ten Pull */}
            <motion.button
              onClick={() => handlePull('ten')}
              disabled={!canAffordTen || isPulling}
              whileHover={canAffordTen ? { scale: 1.05, y: -5 } : {}}
              whileTap={canAffordTen ? { scale: 0.95 } : {}}
              style={{
                padding: '24px 48px',
                fontSize: '22px',
                fontWeight: 'bold',
                background: canAffordTen
                  ? `linear-gradient(135deg, ${ANIME_THEME.primary.gold}, ${ANIME_THEME.accent.purple})`
                  : ANIME_THEME.text.gray,
                color: ANIME_THEME.text.white,
                border: `2px solid ${canAffordTen ? ANIME_THEME.primary.lightGold : ANIME_THEME.text.gray}`,
                borderRadius: '16px',
                cursor: canAffordTen ? 'pointer' : 'not-allowed',
                boxShadow: canAffordTen ? '0 8px 32px rgba(212, 175, 55, 0.6)' : 'none',
                minWidth: '250px',
              }}
            >
              <div>Wish x10</div>
              <div style={{ fontSize: '16px', marginTop: '8px', opacity: 0.9 }}>
                💎 {TEN_PULL_COST}
              </div>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Close button */}
      {onClose && animationStage === 'idle' && (
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
          }}
        >
          ✕
        </motion.button>
      )}
    </div>
  );
};

// Card Reveal Component
const CardReveal: React.FC<{ card: CharacterCard; delay: number }> = ({ card, delay }) => {
  const rarityGradient = ANIME_THEME.rarity[card.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotateY: 180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      style={{
        background: ANIME_THEME.background.card,
        backdropFilter: 'blur(20px)',
        border: `3px solid transparent`,
        backgroundImage: `${rarityGradient}, ${ANIME_THEME.background.card}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        borderRadius: '20px',
        padding: '24px',
        textAlign: 'center',
        boxShadow: `0 8px 32px ${card.rarity === 'SSR' ? 'rgba(255, 215, 0, 0.6)' : 'rgba(159, 122, 234, 0.4)'}`,
      }}
    >
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>
        {card.rarity === 'SSR' ? '⭐⭐⭐' : card.rarity === 'SR' ? '⭐⭐' : '⭐'}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: ANIME_THEME.text.white, marginBottom: '8px' }}>
        {card.nameZh}
      </div>
      <div style={{ fontSize: '18px', color: ANIME_THEME.text.gray }}>
        {card.name}
      </div>
    </motion.div>
  );
};

export default GachaSystem;
