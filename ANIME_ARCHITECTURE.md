# 🎮 Anime-Oriented Chinese Learning Platform - Architecture

## 🌟 Overview

A WOW-factor educational environment combining Visual Novel mechanics, RPG battles, Gacha systems, and AI-powered tutoring for Chinese language learning.

**Inspiration**: Genshin Impact, Honkai Star Rail, Persona series
**Tech Stack**: React 19 + TypeScript, Framer Motion, NestJS, Prisma, PostgreSQL

---

## 📁 Directory Structure

### Frontend (`/frontend/src`)

```
src/
├── components/
│   ├── anime/                          # Anime-specific UI components
│   │   ├── AITutor/
│   │   │   ├── AITutor.tsx            # Main tutor component with Live2D stage
│   │   │   ├── DialogueBox.tsx        # Typewriter effect dialogue
│   │   │   ├── EmotionRenderer.tsx    # Emotion-based animations
│   │   │   └── Live2DStage.tsx        # PixiJS Live2D integration
│   │   ├── Battle/
│   │   │   ├── BattleArena.tsx        # Main battle UI
│   │   │   ├── HPBar.tsx              # Animated HP bar component
│   │   │   ├── DamageNumber.tsx       # Floating damage animations
│   │   │   ├── MonsterCard.tsx        # Enemy monster display
│   │   │   ├── QuestionPanel.tsx      # Chinese question display
│   │   │   └── UltimateMove.tsx       # Hanzi drawing ultimate
│   │   ├── Gacha/
│   │   │   ├── GachaSystem.tsx        # Main gacha UI
│   │   │   ├── PullAnimation.tsx      # Card pull animation
│   │   │   ├── CardReveal.tsx         # SSR/SR/R reveal effects
│   │   │   ├── SpiritStones.tsx       # Currency display
│   │   │   └── CardCollection.tsx     # User's card inventory
│   │   ├── HanziPractice/
│   │   │   ├── HanziWriter.tsx        # hanzi-writer integration
│   │   │   ├── StrokeEffect.tsx       # Particle effects on strokes
│   │   │   └── CalligraphyCanvas.tsx  # Traditional styled canvas
│   │   └── UI/
│   │       ├── AnimeButton.tsx        # Genshin-style buttons
│   │       ├── GoldBorder.tsx         # Elegant border component
│   │       ├── GlowCard.tsx           # Card with glow effects
│   │       └── StarBackground.tsx     # Animated star field
│   ├── Dashboard.tsx
│   ├── WelcomeScreen.tsx
│   └── ... (existing components)
│
├── contexts/
│   ├── BattleContext.tsx              # Combat state management
│   ├── GachaContext.tsx               # Gacha state & inventory
│   ├── TutorContext.tsx               # AI tutor conversation state
│   └── ProgressionContext.tsx         # Spirit stones, XP, levels
│
├── hooks/
│   ├── useBattleEngine.ts             # Battle logic hook
│   ├── useDialogue.ts                 # Typewriter effect hook
│   ├── useGacha.ts                    # Gacha pull logic
│   ├── useParticles.ts                # Particle effect utilities
│   └── useLive2D.ts                   # Live2D model management
│
├── services/
│   ├── api.ts                         # (existing)
│   ├── tutorAPI.ts                    # AI Tutor endpoints
│   ├── battleAPI.ts                   # Battle/Monster endpoints
│   └── gachaAPI.ts                    # Gacha endpoints
│
├── types/
│   ├── anime.types.ts                 # Anime module types
│   ├── battle.types.ts                # Battle system types
│   ├── gacha.types.ts                 # Gacha system types
│   └── tutor.types.ts                 # AI Tutor types
│
├── animations/
│   ├── battleAnimations.ts            # Framer Motion battle variants
│   ├── gachaAnimations.ts             # Gacha pull animations
│   └── particleEffects.ts             # Particle configurations
│
└── assets/
    ├── models/                        # Live2D models (.model3.json)
    ├── backgrounds/                   # Dynamic backgrounds
    ├── cards/                         # Character card artwork
    └── effects/                       # Particle textures
```

### Backend (`/backend/src`)

```
src/
├── tutor/
│   ├── tutor.module.ts
│   ├── tutor.controller.ts
│   ├── tutor.service.ts               # OpenAI integration
│   ├── dto/
│   │   ├── chat.dto.ts
│   │   └── tutor-response.dto.ts
│   └── interfaces/
│       └── emotion.interface.ts
│
├── battle/
│   ├── battle.module.ts
│   ├── battle.controller.ts
│   ├── battle.service.ts              # Combat logic
│   ├── entities/
│   │   ├── monster.entity.ts
│   │   ├── battle-session.entity.ts
│   │   └── question.entity.ts
│   └── dto/
│       ├── attack.dto.ts
│       └── battle-result.dto.ts
│
├── gacha/
│   ├── gacha.module.ts
│   ├── gacha.controller.ts
│   ├── gacha.service.ts               # Probability logic
│   ├── entities/
│   │   ├── character-card.entity.ts
│   │   └── user-card.entity.ts
│   └── dto/
│       ├── pull.dto.ts
│       └── card-result.dto.ts
│
├── progression/
│   ├── progression.module.ts
│   ├── progression.controller.ts
│   ├── progression.service.ts
│   └── entities/
│       └── spirit-stones.entity.ts
│
├── prisma/
│   ├── schema.prisma                  # Updated schema
│   └── ...
│
└── ... (existing modules)
```

---

## 🎨 Design System - Genshin Impact Style

### Color Palette

```typescript
// Gold & Elegant Theme
const THEME = {
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
    SSR: 'linear-gradient(135deg, #FFD700, #FFA500)', // Gold
    SR: 'linear-gradient(135deg, #9F7AEA, #B794F4)',  // Purple
    R: 'linear-gradient(135deg, #4299E1, #63B3ED)',   // Blue
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
};
```

### Border & Shadow Styles

```css
/* Genshin-style borders */
.anime-border {
  border: 2px solid;
  border-image: linear-gradient(135deg, #D4AF37, #FFD700) 1;
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3),
              inset 0 0 20px rgba(255, 215, 0, 0.1);
}

/* Glass morphism */
.glass-card {
  background: rgba(26, 14, 46, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 215, 0, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Glow effect */
.glow-effect {
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
  animation: pulse-glow 2s ease-in-out infinite;
}
```

---

## 🎭 Module Specifications

### 1. Visual Novel Interface (AITutor)

**Components**:
- **Live2DStage**: PixiJS canvas rendering Live2D model
- **DialogueBox**: Semi-transparent box with typewriter effect
- **EmotionRenderer**: Changes character expression based on `emotion` field

**Emotion States**:
- `joy`: Happy expression, bouncing animation
- `study`: Focused expression, glasses glint effect
- `surprised`: Wide eyes, slight shake animation

**API Response**:
```typescript
interface TutorResponse {
  hanzi: string;        // "你好"
  pinyin: string;       // "nǐ hǎo"
  translation: string;  // "Hello"
  feedback: string;     // "Great pronunciation!"
  emotion: 'joy' | 'study' | 'surprised';
}
```

### 2. AI-Powered Tutor (NestJS Service)

**OpenAI Integration**:
- Use GPT-4 with custom system prompt
- Parse response into structured JSON
- Store conversation history for context

**Endpoints**:
- `POST /tutor/chat` - Send user message, get tutor response
- `GET /tutor/history/:userId` - Get conversation history
- `POST /tutor/emotion/:emotion` - Trigger specific emotion

### 3. RPG Battle System

**Combat Flow**:
1. User enters battle → Monster appears
2. Question displayed (multiple choice or type answer)
3. Correct answer → Deal damage (HP bar animation)
4. Wrong answer → Take damage
5. Ultimate Move → Hanzi drawing minigame
6. Victory → Earn Spirit Stones + XP

**State Management**:
```typescript
interface BattleState {
  playerHP: number;
  monsterHP: number;
  currentQuestion: Question;
  turn: 'player' | 'monster';
  ultimateCharge: number; // 0-100%
  isUltimateActive: boolean;
}
```

### 4. Hanzi Writer Integration

**Features**:
- Traditional calligraphy paper background
- Stroke order animation
- Particle effects on correct strokes (gold sparkles)
- Mistake detection with red highlight
- Completion celebration (fireworks)

**Libraries**:
- `hanzi-writer` for stroke detection
- Custom canvas overlay for particle effects

### 5. Gacha & Progression

**Rarity Probabilities**:
- **SSR**: 1.6% (Guaranteed at 90 pulls)
- **SR**: 13% (Guaranteed at 10 pulls)
- **R**: 85.4%

**Pull Animation Sequence**:
1. Tap "Pull" button → Spirit stones fly out
2. Golden gate appears with light beams
3. Card flies toward camera (Framer Motion 3D transform)
4. Rarity reveal with color flash
5. Character art reveal with voice line

**Pity System**:
- Track pulls since last SSR/SR
- Increment probability after 70 pulls (soft pity)
- Guaranteed SSR at 90 pulls

---

## 🔌 Integration Points

### Live2D Setup (PixiJS)

```typescript
// frontend/src/hooks/useLive2D.ts
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';

// 1. Create PixiJS app
// 2. Load .model3.json file
// 3. Handle expressions: model.internalModel.coreModel.setParameterValueById()
// 4. Sync with emotion state from AITutor
```

### OpenAI API Setup

```typescript
// backend/src/tutor/tutor.service.ts
import { Configuration, OpenAIApi } from 'openai';

const systemPrompt = `
You are 小美 (Xiǎo Měi), an anime-style Chinese tutor.
Respond with JSON: { hanzi, pinyin, translation, feedback, emotion }.
Emotion must be: "joy", "study", or "surprised".
Be encouraging and use 加油 (jiā yóu) often!
`;

// Use GPT-4 with structured output
```

---

## 📦 Required Dependencies

### Frontend
```bash
npm install framer-motion hanzi-writer pixi.js pixi-live2d-display @types/pixi.js
```

### Backend
```bash
npm install openai @nestjs/axios
```

---

## 🚀 Implementation Phases

### Phase 1: Core Components (Week 1)
- [ ] Directory structure setup
- [ ] TypeScript types/interfaces
- [ ] AnimeButton, GoldBorder, GlowCard UI components
- [ ] BattleContext + useBattleEngine hook
- [ ] Basic HPBar and DamageNumber components

### Phase 2: Visual Novel (Week 2)
- [ ] DialogueBox with typewriter effect
- [ ] EmotionRenderer component
- [ ] Live2DStage PixiJS integration
- [ ] AITutor main component
- [ ] NestJS TutorService + OpenAI

### Phase 3: Battle System (Week 3)
- [ ] BattleArena UI layout
- [ ] QuestionPanel component
- [ ] Combat logic in useBattleEngine
- [ ] Damage animations (Framer Motion)
- [ ] NestJS BattleService + Monster entities

### Phase 4: Hanzi & Gacha (Week 4)
- [ ] HanziWriter integration
- [ ] Particle effects on strokes
- [ ] GachaSystem UI
- [ ] Pull animation sequence
- [ ] NestJS GachaService with probability logic
- [ ] CardCollection inventory

---

## 🎯 Success Metrics

- **Engagement**: Average session time > 15 minutes
- **Retention**: 30-day retention > 40%
- **Learning**: Words learned per session > 10
- **Monetization**: Gacha conversion rate > 5%

---

## 📝 Notes for Developers

1. **Performance**: Use React.memo() for heavy components (Live2D, particles)
2. **Accessibility**: Ensure all interactive elements are keyboard-navigable
3. **Mobile**: Design mobile-first, but optimize for desktop landscape
4. **Audio**: Add sound effects for battles, gacha pulls (optional Phase 5)
5. **Localization**: Prepare for English/Chinese UI toggle

---

**Next Steps**: See individual component implementations below.
