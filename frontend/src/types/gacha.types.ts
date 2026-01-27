/**
 * 🎰 Gacha System - Type Definitions
 *
 * Types for the character card gacha/wish system.
 * Includes rarity, pity system, and pull mechanics.
 */

import type { RarityType } from './anime.types';

// ===========================
// CHARACTER CARD
// ===========================

export interface CharacterCard {
  id: string;
  name: string;
  nameZh: string; // Chinese name
  rarity: RarityType;
  imageUrl: string;
  thumbnailUrl: string;
  element: ElementType;
  role: RoleType;
  description: string;
  voiceLine?: string; // Audio URL
  stats: {
    attack: number;
    defense: number;
    speed: number;
    special: number; // Element-specific
  };
  skill: {
    name: string;
    nameZh: string;
    description: string;
    animation: string; // Animation key
  };
  obtainedAt?: Date;
  duplicates?: number; // For constellation/constellation system
}

export type ElementType = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';

export type RoleType = 'attacker' | 'defender' | 'healer' | 'support';

// ===========================
// GACHA PULL
// ===========================

export interface PullRequest {
  userId: string;
  pullType: 'single' | 'ten';
  bannerId?: string; // For limited banners
}

export interface PullResult {
  cards: CharacterCard[];
  spiritStonesSpent: number;
  newCards: string[]; // IDs of new cards
  duplicates: string[]; // IDs of duplicates
  guaranteedPity: boolean; // Was this a pity pull?
  pullNumber: number; // Current pull count
}

// ===========================
// PITY SYSTEM
// ===========================

export interface PityState {
  userId: string;
  pullsSinceLastSSR: number;
  pullsSinceLastSR: number;
  totalPulls: number;
  guaranteedSSRAt: number; // Usually 90
  guaranteedSRAt: number; // Usually 10
  softPityStart: number; // Usually 70 for SSR
  increasedRates: boolean; // Soft pity active
}

// ===========================
// GACHA PROBABILITIES
// ===========================

export interface GachaProbability {
  base: {
    SSR: number; // 1.6%
    SR: number; // 13%
    R: number; // 85.4%
  };
  softPity: {
    startAt: number; // Pull 70
    increment: number; // +5% per pull
  };
  guaranteed: {
    SSR: number; // Pull 90
    SR: number; // Pull 10
  };
}

export const DEFAULT_GACHA_PROBABILITY: GachaProbability = {
  base: {
    SSR: 0.016,
    SR: 0.13,
    R: 0.854,
  },
  softPity: {
    startAt: 70,
    increment: 0.05,
  },
  guaranteed: {
    SSR: 90,
    SR: 10,
  },
};

// ===========================
// PULL ANIMATION
// ===========================

export interface PullAnimationConfig {
  duration: number;
  stages: {
    spiritStones: number; // Animation duration in ms
    gate: number;
    cardFlight: number;
    rarityReveal: number;
    characterReveal: number;
  };
  skipEnabled: boolean;
}

export interface PullAnimationState {
  stage: 'idle' | 'pulling' | 'revealing' | 'complete';
  currentCard: number; // For 10-pulls
  canSkip: boolean;
}

// ===========================
// BANNER
// ===========================

export interface GachaBanner {
  id: string;
  name: string;
  nameZh: string;
  type: 'standard' | 'character' | 'limited';
  startDate: Date;
  endDate?: Date; // Null for standard banner
  featuredSSR?: string[]; // Card IDs with rate-up
  featuredSR?: string[];
  imageUrl: string;
  description: string;
  guaranteedFeatured: boolean; // 50/50 system
}

// ===========================
// USER INVENTORY
// ===========================

export interface UserInventory {
  userId: string;
  cards: UserCard[];
  totalCards: number;
  uniqueCards: number;
  ssrCount: number;
  srCount: number;
  rCount: number;
}

export interface UserCard {
  cardId: string;
  obtainedAt: Date;
  duplicates: number;
  level: number;
  maxLevel: number;
  isLocked: boolean; // Prevent accidental disposal
}

// ===========================
// WISH HISTORY
// ===========================

export interface WishHistory {
  userId: string;
  pulls: WishRecord[];
}

export interface WishRecord {
  id: string;
  timestamp: Date;
  pullType: 'single' | 'ten';
  bannerId: string;
  results: {
    cardId: string;
    rarity: RarityType;
    isNew: boolean;
  }[];
  spiritStonesSpent: number;
}
