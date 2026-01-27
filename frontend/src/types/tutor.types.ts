/**
 * 🎭 AI Tutor Module - Type Definitions
 *
 * Types for the Visual Novel-style AI tutor with Live2D integration.
 */

// ===========================
// EMOTION SYSTEM
// ===========================

export type EmotionType = 'joy' | 'study' | 'surprised' | 'neutral' | 'thinking';

export interface EmotionConfig {
  expression: string; // Live2D expression name
  animation: 'bounce' | 'shake' | 'glint' | 'idle';
  duration: number;
  particleEffect?: {
    type: 'hearts' | 'stars' | 'sparkles';
    color: string;
  };
}

// ===========================
// TUTOR RESPONSE
// ===========================

export interface TutorResponse {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  feedback: string;
  emotion: EmotionType;
  timestamp: Date;
  context?: string; // Additional context for learning
}

// ===========================
// DIALOGUE SYSTEM
// ===========================

export interface DialogueMessage {
  id: string;
  speaker: 'tutor' | 'user';
  content: string;
  hanzi?: string;
  pinyin?: string;
  translation?: string;
  emotion?: EmotionType;
  timestamp: Date;
}

export interface DialogueHistory {
  userId: string;
  messages: DialogueMessage[];
  currentTopic?: string;
  lessonProgress?: number;
}

// ===========================
// LIVE2D INTEGRATION
// ===========================

export interface Live2DModelConfig {
  modelPath: string; // Path to .model3.json
  scale: number;
  position: { x: number; y: number };
  expressions: Record<EmotionType, string>; // Expression name mapping
  motions?: {
    idle: string;
    tap_body: string;
    tap_head: string;
  };
}

export interface Live2DState {
  isLoaded: boolean;
  currentEmotion: EmotionType;
  isPlaying: boolean;
  error?: string;
}

// ===========================
// TYPEWRITER EFFECT
// ===========================

export interface TypewriterConfig {
  speed: number; // Characters per second
  delay: number; // Initial delay in ms
  pauseOnPunctuation: number; // Extra pause on ,.!? in ms
  skipOnClick: boolean;
}

// ===========================
// BACKGROUND SYSTEM
// ===========================

export type BackgroundType =
  | 'classroom'
  | 'library'
  | 'garden'
  | 'city'
  | 'night_sky'
  | 'traditional_room';

export interface DynamicBackground {
  type: BackgroundType;
  imagePath: string;
  particles?: {
    enabled: boolean;
    type: 'sakura' | 'stars' | 'fireflies' | 'snow';
  };
  transition?: {
    duration: number;
    effect: 'fade' | 'slide' | 'zoom';
  };
}

// ===========================
// TUTOR SESSION
// ===========================

export interface TutorSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  topic: string;
  messagesCount: number;
  wordsLearned: string[];
  currentBackground: BackgroundType;
}
