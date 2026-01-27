/**
 * 🎮 Anime Module - Core Type Definitions
 *
 * Shared types for the anime-oriented learning platform.
 * Inspired by Genshin Impact / Honkai Star Rail UI/UX.
 */

// ===========================
// THEME & STYLING
// ===========================

export const ANIME_THEME = {
  primary: {
    gold: '#D4AF37',
    lightGold: '#FFD700',
    darkGold: '#B8860B',
  },
  accent: {
    purple: '#9F7AEA',
    blue: '#4299E1',
    pink: '#ED64A6',
  },
  rarity: {
    SSR: 'linear-gradient(135deg, #FFD700, #FFA500)',
    SR: 'linear-gradient(135deg, #9F7AEA, #B794F4)',
    R: 'linear-gradient(135deg, #4299E1, #63B3ED)',
  },
  background: {
    dark: '#1A0E2E',
    card: 'rgba(26, 14, 46, 0.85)',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  text: {
    gold: '#FFD700',
    white: '#FFFFFF',
    gray: '#A0AEC0',
  },
} as const;

export type RarityType = 'SSR' | 'SR' | 'R';

// ===========================
// ANIMATION TYPES
// ===========================

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
  speed: number;
  lifetime: number;
}

export interface AnimationVariant {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
  transition?: {
    duration: number;
    ease?: string | number[];
    delay?: number;
  };
}

// ===========================
// PROGRESSION SYSTEM
// ===========================

export interface UserProgression {
  userId: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  spiritStones: number;
  totalPulls: number;
  pullsSinceLastSSR: number;
  pullsSinceLastSR: number;
}

export interface RewardData {
  spiritStones?: number;
  experience?: number;
  cards?: string[]; // Card IDs
}
