/**
 * 🎰 Gacha Service
 *
 * Character card gacha system with pity mechanics.
 * Implements Genshin Impact-style probability system.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CharacterCard {
  id: string;
  name: string;
  nameZh: string;
  rarity: 'SSR' | 'SR' | 'R';
  imageUrl: string;
  element: string;
  role: string;
}

export interface PullResult {
  cards: CharacterCard[];
  spiritStonesSpent: number;
  newCards: string[];
  duplicates: string[];
  guaranteedPity: boolean;
  pullNumber: number;
}

export interface PityState {
  userId: string;
  pullsSinceLastSSR: number;
  pullsSinceLastSR: number;
  totalPulls: number;
  guaranteedSSRAt: number;
  guaranteedSRAt: number;
  softPityStart: number;
  increasedRates: boolean;
}

@Injectable()
export class GachaService {
  // Gacha constants
  private readonly SSR_BASE_RATE = 0.016; // 1.6%
  private readonly SR_BASE_RATE = 0.13; // 13%
  private readonly R_BASE_RATE = 0.854; // 85.4%

  private readonly SSR_PITY_HARD = 90;
  private readonly SR_PITY_HARD = 10;
  private readonly SSR_PITY_SOFT_START = 70;

  private readonly SOFT_PITY_INCREMENT = 0.05; // +5% per pull after soft pity

  private readonly SINGLE_PULL_COST = 160;
  private readonly TEN_PULL_COST = 1600;

  // Mock card pool (in production, this would be from database)
  private readonly CARD_POOL: CharacterCard[] = [
    // SSR Cards
    {
      id: 'ssr_1',
      name: 'Dragon Scholar',
      nameZh: '龙学者',
      rarity: 'SSR',
      imageUrl: '/assets/cards/dragon_scholar.jpg',
      element: 'fire',
      role: 'attacker',
    },
    {
      id: 'ssr_2',
      name: 'Phoenix Master',
      nameZh: '凤凰大师',
      rarity: 'SSR',
      imageUrl: '/assets/cards/phoenix_master.jpg',
      element: 'light',
      role: 'healer',
    },
    {
      id: 'ssr_3',
      name: 'Celestial Sage',
      nameZh: '天仙',
      rarity: 'SSR',
      imageUrl: '/assets/cards/celestial_sage.jpg',
      element: 'wind',
      role: 'support',
    },
    // SR Cards
    {
      id: 'sr_1',
      name: 'Thunder Warrior',
      nameZh: '雷战士',
      rarity: 'SR',
      imageUrl: '/assets/cards/thunder_warrior.jpg',
      element: 'dark',
      role: 'attacker',
    },
    {
      id: 'sr_2',
      name: 'Water Monk',
      nameZh: '水和尚',
      rarity: 'SR',
      imageUrl: '/assets/cards/water_monk.jpg',
      element: 'water',
      role: 'defender',
    },
    {
      id: 'sr_3',
      name: 'Forest Guardian',
      nameZh: '森林守护者',
      rarity: 'SR',
      imageUrl: '/assets/cards/forest_guardian.jpg',
      element: 'earth',
      role: 'support',
    },
    // R Cards
    {
      id: 'r_1',
      name: 'Young Student',
      nameZh: '小学生',
      rarity: 'R',
      imageUrl: '/assets/cards/young_student.jpg',
      element: 'fire',
      role: 'attacker',
    },
    {
      id: 'r_2',
      name: 'Apprentice Scribe',
      nameZh: '书生',
      rarity: 'R',
      imageUrl: '/assets/cards/apprentice_scribe.jpg',
      element: 'water',
      role: 'support',
    },
    {
      id: 'r_3',
      name: 'Village Guard',
      nameZh: '村民',
      rarity: 'R',
      imageUrl: '/assets/cards/village_guard.jpg',
      element: 'earth',
      role: 'defender',
    },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Perform gacha pull
   */
  async pull(userId: string, pullType: 'single' | 'ten'): Promise<PullResult> {
    const pullCount = pullType === 'single' ? 1 : 10;
    const cost = pullType === 'single' ? this.SINGLE_PULL_COST : this.TEN_PULL_COST;

    // Get user's pity state (in production, fetch from database)
    const pityState = await this.getPityState(userId);

    // Check if user has enough spirit stones (in production)
    // const userProgress = await this.prisma.userProgress.findUnique({ where: { userId } });
    // if (!userProgress || userProgress.spiritStones < cost) {
    //   throw new Error('Insufficient spirit stones');
    // }

    const pulledCards: CharacterCard[] = [];
    let pullsSinceLastSSR = pityState.pullsSinceLastSR;
    let pullsSinceLastSR = pityState.pullsSinceLastSR;
    let guaranteedPity = false;

    // Perform each pull
    for (let i = 0; i < pullCount; i++) {
      const card = this.performSinglePull(pullsSinceLastSSR, pullsSinceLastSR);
      pulledCards.push(card);

      // Update pity counters
      if (card.rarity === 'SSR') {
        pullsSinceLastSSR = 0;
        guaranteedPity = pityState.pullsSinceLastSSR >= this.SSR_PITY_HARD;
      } else {
        pullsSinceLastSSR++;
      }

      if (card.rarity === 'SR' || card.rarity === 'SSR') {
        pullsSinceLastSR = 0;
      } else {
        pullsSinceLastSR++;
      }
    }

    // Update user's pity state and spirit stones (in production)
    // await this.updatePityState(userId, pullsSinceLastSSR, pullsSinceLastSR);
    // await this.prisma.userProgress.update({
    //   where: { userId },
    //   data: { spiritStones: { decrement: cost } }
    // });

    // Determine new vs duplicate cards (simplified)
    const newCards = pulledCards.filter(() => Math.random() > 0.5).map((c) => c.id);
    const duplicates = pulledCards.filter((c) => !newCards.includes(c.id)).map((c) => c.id);

    return {
      cards: pulledCards,
      spiritStonesSpent: cost,
      newCards,
      duplicates,
      guaranteedPity,
      pullNumber: pityState.totalPulls + pullCount,
    };
  }

  /**
   * Perform a single pull with pity logic
   */
  private performSinglePull(pullsSinceLastSSR: number, pullsSinceLastSR: number): CharacterCard {
    // Hard pity - guaranteed SSR
    if (pullsSinceLastSSR >= this.SSR_PITY_HARD) {
      return this.getRandomCard('SSR');
    }

    // Hard pity - guaranteed SR (if no SR/SSR in last 9 pulls)
    if (pullsSinceLastSR >= this.SR_PITY_HARD) {
      return this.getRandomCard('SR');
    }

    // Calculate soft pity for SSR
    let ssrRate = this.SSR_BASE_RATE;
    if (pullsSinceLastSSR >= this.SSR_PITY_SOFT_START) {
      const softPityPulls = pullsSinceLastSSR - this.SSR_PITY_SOFT_START;
      ssrRate += softPityPulls * this.SOFT_PITY_INCREMENT;
    }

    // Roll for rarity
    const roll = Math.random();

    if (roll < ssrRate) {
      return this.getRandomCard('SSR');
    } else if (roll < ssrRate + this.SR_BASE_RATE) {
      return this.getRandomCard('SR');
    } else {
      return this.getRandomCard('R');
    }
  }

  /**
   * Get random card of specific rarity
   */
  private getRandomCard(rarity: 'SSR' | 'SR' | 'R'): CharacterCard {
    const cardsOfRarity = this.CARD_POOL.filter((c) => c.rarity === rarity);
    const randomIndex = Math.floor(Math.random() * cardsOfRarity.length);
    return { ...cardsOfRarity[randomIndex] }; // Clone to avoid mutation
  }

  /**
   * Get user's pity state
   */
  async getPityState(userId: string): Promise<PityState> {
    // In production, fetch from database
    // For now, return mock data
    return {
      userId,
      pullsSinceLastSSR: 45,
      pullsSinceLastSR: 3,
      totalPulls: 150,
      guaranteedSSRAt: this.SSR_PITY_HARD,
      guaranteedSRAt: this.SR_PITY_HARD,
      softPityStart: this.SSR_PITY_SOFT_START,
      increasedRates: 45 >= this.SSR_PITY_SOFT_START,
    };
  }

  /**
   * Get all available cards
   */
  getAllCards(): CharacterCard[] {
    return [...this.CARD_POOL]; // Return copy
  }

  /**
   * Get cards by rarity
   */
  getCardsByRarity(rarity: 'SSR' | 'SR' | 'R'): CharacterCard[] {
    return this.CARD_POOL.filter((c) => c.rarity === rarity);
  }
}
