/**
 * ⚔️ Battle System - Type Definitions
 *
 * Types for the RPG-style combat system with Chinese language questions.
 */

// ===========================
// COMBAT STATE
// ===========================

export interface BattleState {
  battleId: string;
  playerHP: number;
  playerMaxHP: number;
  monsterHP: number;
  monsterMaxHP: number;
  currentQuestion: Question | null;
  turn: 'player' | 'monster' | 'waiting';
  ultimateCharge: number; // 0-100%
  isUltimateActive: boolean;
  combo: number;
  round: number;
  status: 'active' | 'victory' | 'defeat' | 'pending';
}

// ===========================
// MONSTER
// ===========================

export interface Monster {
  id: string;
  name: string;
  nameZh: string; // Chinese name
  level: number;
  maxHP: number;
  attack: number;
  defense: number;
  imageUrl: string;
  type: MonsterType;
  description: string;
  rewards: {
    spiritStones: number;
    experience: number;
    cardDropChance?: number; // 0-100%
  };
}

export type MonsterType =
  | 'vocabulary' // Focuses on word recognition
  | 'grammar' // Grammar questions
  | 'listening' // Audio-based questions
  | 'writing' // Hanzi writing
  | 'boss'; // Mixed difficulty

// ===========================
// QUESTIONS
// ===========================

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: 1 | 2 | 3 | 4 | 5; // HSK level
  question: string;
  questionZh?: string; // Chinese version of question
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation?: string;
  hanzi?: string; // For writing questions
  audioUrl?: string; // For listening questions
  timeLimit?: number; // Seconds
}

export type QuestionType =
  | 'multiple_choice'
  | 'type_answer'
  | 'hanzi_drawing'
  | 'listening'
  | 'translation';

// ===========================
// COMBAT ACTIONS
// ===========================

export interface AttackAction {
  battleId: string;
  questionId: string;
  userAnswer: string;
  timeSpent: number; // Seconds
}

export interface AttackResult {
  isCorrect: boolean;
  damage: number;
  criticalHit: boolean; // Fast answer bonus
  ultimateChargeGain: number;
  combo: number;
  newPlayerHP: number;
  newMonsterHP: number;
  explanation?: string;
}

// ===========================
// ULTIMATE MOVE
// ===========================

export interface UltimateMove {
  name: string;
  nameZh: string;
  description: string;
  hanziRequired: string; // Character to draw
  baseDamage: number;
  animation: 'slash' | 'fireball' | 'lightning' | 'heal';
  particleEffect: {
    color: string;
    shape: 'circle' | 'star' | 'spark';
    count: number;
  };
}

export interface HanziDrawingResult {
  character: string;
  accuracy: number; // 0-100%
  strokesCorrect: number;
  strokesTotal: number;
  timeSpent: number;
  perfectStrokes: number[]; // Indices of perfect strokes
}

// ===========================
// BATTLE REWARDS
// ===========================

export interface BattleRewards {
  spiritStones: number;
  experience: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  perfectRound: boolean; // No damage taken
  speedBonus: number; // Extra stones for fast completion
  comboBonus: number; // Extra for high combo
  cardDrops?: {
    id: string;
    name: string;
    rarity: 'SSR' | 'SR' | 'R';
  }[];
}

// ===========================
// DAMAGE ANIMATION
// ===========================

export interface DamageAnimation {
  value: number;
  type: 'damage' | 'heal' | 'critical' | 'miss';
  position: { x: number; y: number };
  color: string;
  scale: number;
}

// ===========================
// HP BAR
// ===========================

export interface HPBarConfig {
  current: number;
  max: number;
  color: string;
  backgroundColor: string;
  showPercentage: boolean;
  animated: boolean;
  glowEffect: boolean;
}
