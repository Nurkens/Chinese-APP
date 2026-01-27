# 🎮 Anime Platform - Setup Guide

## 📦 Installation Steps

### Frontend Dependencies

```bash
cd frontend

# Core dependencies (already installed)
# - framer-motion (animations)
# - React 19, TypeScript, Tailwind

# NEW dependencies to install:
npm install hanzi-writer pixi.js pixi-live2d-display --save

# TypeScript types
npm install @types/pixi.js --save-dev
```

### Backend Dependencies

```bash
cd backend

# NEW dependencies to install:
npm install openai --save
```

---

## 🔧 Configuration

### 1. Environment Variables

Add to `backend/.env`:

```env
# OpenAI API Key (for AI Tutor)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Existing variables...
DATABASE_URL="postgresql://postgres:your_password@localhost:5433/chinese_learning?schema=public"
JWT_SECRET=your-jwt-secret-key
```

### 2. Update App Module

Edit `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WordsModule } from './words/words.module';
import { UserModule } from './user/user.module';
import { GoalsModule } from './goals/goals.module';
import { TutorModule } from './tutor/tutor.module';  // ADD THIS
import { GachaModule } from './gacha/gacha.module';  // ADD THIS

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    WordsModule,
    UserModule,
    GoalsModule,
    TutorModule,   // ADD THIS
    GachaModule,   // ADD THIS
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 3. Create Frontend API Services

Create `frontend/src/services/tutorAPI.ts`:

```typescript
import api from './api';

export const tutorAPI = {
  chat: async (message: string) => {
    const response = await api.post('/tutor/chat', { message });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/tutor/history');
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.post('/tutor/history/clear');
    return response.data;
  },

  triggerEmotion: async (emotion: string) => {
    const response = await api.post(`/tutor/emotion/${emotion}`);
    return response.data;
  },
};
```

Create `frontend/src/services/gachaAPI.ts`:

```typescript
import api from './api';

export const gachaAPI = {
  pull: async (pullType: 'single' | 'ten') => {
    const response = await api.post('/gacha/pull', { pullType });
    return response.data;
  },

  getPityState: async () => {
    const response = await api.get('/gacha/pity');
    return response.data;
  },

  getAllCards: async () => {
    const response = await api.get('/gacha/cards');
    return response.data;
  },
};
```

---

## 🎨 Live2D Model Setup (Optional)

### Download Free Live2D Models

1. Visit: https://www.live2d.com/en/download/sample-data/
2. Download a sample model (e.g., "Hiyori")
3. Extract to `frontend/public/assets/models/xiaomei/`

### Model Structure

```
frontend/public/assets/models/xiaomei/
├── xiaomei.model3.json          (main model file)
├── textures/
│   └── texture_00.png
├── expressions/
│   ├── happy.exp3.json
│   ├── focused.exp3.json
│   ├── surprised.exp3.json
│   ├── thinking.exp3.json
│   └── default.exp3.json
└── motions/
    ├── idle.motion3.json
    ├── tap_head.motion3.json
    └── tap_body.motion3.json
```

### Enable Live2D in AITutor

Uncomment this section in `frontend/src/components/anime/AITutor/AITutor.tsx`:

```typescript
// Replace placeholder with:
<Live2DStage
  modelPath="/assets/models/xiaomei/xiaomei.model3.json"
  emotion={currentEmotion}
  scale={0.5}
  position={{ x: 0, y: 50 }}
/>
```

---

## 🚀 Running the Application

### Start Backend

```bash
cd backend
npm run start:dev
```

Backend runs on: http://localhost:3000

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: http://localhost:5173

---

## 🎯 Testing the Features

### 1. AI Tutor

Add to Dashboard.tsx:

```typescript
import AITutor from './components/anime/AITutor/AITutor';

const [showTutor, setShowTutor] = useState(false);

// Add button
<button onClick={() => setShowTutor(true)}>
  Talk to 小美
</button>

// Render tutor
{showTutor && (
  <AITutor
    userId={currentUser.id}
    initialBackground="classroom"
    onClose={() => setShowTutor(false)}
  />
)}
```

### 2. Gacha System

```typescript
import GachaSystem from './components/anime/Gacha/GachaSystem';

const [showGacha, setShowGacha] = useState(false);
const [pityState, setPityState] = useState(null);

useEffect(() => {
  gachaAPI.getPityState().then(setPityState);
}, []);

// Add button
<button onClick={() => setShowGacha(true)}>
  Character Wish
</button>

// Render gacha
{showGacha && pityState && (
  <GachaSystem
    userId={currentUser.id}
    spiritStones={1000}
    pityState={pityState}
    onPull={gachaAPI.pull}
    onClose={() => setShowGacha(false)}
  />
)}
```

### 3. Hanzi Writer

```typescript
import HanziWriter from './components/anime/HanziPractice/HanziWriter';

<HanziWriter
  character="人"
  onComplete={(result) => {
    console.log('Drawing result:', result);
  }}
  showHints={true}
  showOutline={true}
  size={400}
/>
```

### 4. Battle System

```typescript
import { useBattleEngine } from './hooks/useBattleEngine';

const { battleState, startBattle, attack } = useBattleEngine();

const mockMonster = {
  id: 'monster1',
  name: 'Vocabulary Beast',
  nameZh: '词汇兽',
  level: 1,
  maxHP: 100,
  attack: 10,
  defense: 5,
  imageUrl: '/assets/monsters/vocab_beast.png',
  type: 'vocabulary' as const,
  description: 'Tests your vocabulary knowledge!',
  rewards: {
    spiritStones: 50,
    experience: 100,
  },
};

<button onClick={() => startBattle(mockMonster)}>
  Start Battle
</button>
```

---

## 📋 API Endpoints

### AI Tutor

- `POST /tutor/chat` - Send message
  - Body: `{ message: string }`
  - Returns: `TutorResponse`

- `GET /tutor/history` - Get conversation history

- `POST /tutor/history/clear` - Clear history

- `POST /tutor/emotion/:emotion` - Trigger specific emotion

### Gacha

- `POST /gacha/pull` - Perform pull
  - Body: `{ pullType: 'single' | 'ten' }`
  - Returns: `PullResult`

- `GET /gacha/pity` - Get pity state

- `GET /gacha/cards` - Get all cards

---

## 🎨 Customization

### Change Theme Colors

Edit `frontend/src/types/anime.types.ts`:

```typescript
export const ANIME_THEME = {
  primary: {
    gold: '#YOUR_COLOR',      // Change gold accent
    lightGold: '#YOUR_COLOR',
    darkGold: '#YOUR_COLOR',
  },
  // ... customize other colors
};
```

### Add New Character Cards

Edit `backend/src/gacha/gacha.service.ts`:

```typescript
private readonly CARD_POOL: CharacterCard[] = [
  {
    id: 'ssr_new',
    name: 'Your Character',
    nameZh: '你的角色',
    rarity: 'SSR',
    imageUrl: '/assets/cards/your_character.jpg',
    element: 'fire',
    role: 'attacker',
  },
  // ... add more cards
];
```

### Modify Gacha Rates

Edit constants in `backend/src/gacha/gacha.service.ts`:

```typescript
private readonly SSR_BASE_RATE = 0.016; // Change to 0.02 for 2%
private readonly SSR_PITY_HARD = 90;    // Change to 80 for earlier pity
```

---

## 🐛 Troubleshooting

### OpenAI API Not Working

If you see "OPENAI_API_KEY not found":
1. Make sure `.env` file exists in `backend/`
2. Restart the backend server
3. The app will use mock responses if API key is missing

### Live2D Model Not Loading

1. Check model path is correct
2. Ensure `.model3.json` file exists
3. Check browser console for errors
4. Try a simpler model first

### Hanzi Writer Not Rendering

1. Clear npm cache: `npm cache clean --force`
2. Reinstall: `npm install hanzi-writer --save`
3. Check character exists in hanzi-writer database

### Framer Motion Errors

If you see animation errors:
1. Make sure framer-motion is installed
2. Check React version compatibility (needs React 18+)
3. Clear `.vite` cache: `rm -rf frontend/node_modules/.vite`

---

## 📚 Next Steps

1. **Database Integration**
   - Add Prisma schemas for gacha cards, battle sessions
   - Store conversation history in database
   - Track user's card inventory

2. **Sound Effects**
   - Add audio for gacha pulls
   - Battle hit sounds
   - Background music

3. **More Features**
   - Team composition system
   - Card upgrade mechanics
   - Multiplayer battles
   - Daily missions

4. **Performance**
   - Optimize particle effects
   - Lazy load Live2D models
   - Implement card texture caching

---

## 🎓 Learning Resources

- **Framer Motion**: https://www.framer.com/motion/
- **Hanzi Writer**: https://chanind.github.io/hanzi-writer/
- **Live2D**: https://www.live2d.com/en/learn/
- **OpenAI API**: https://platform.openai.com/docs/

---

## ✅ Verification Checklist

- [ ] Frontend dependencies installed
- [ ] Backend dependencies installed
- [ ] `.env` file configured with OPENAI_API_KEY
- [ ] TutorModule imported in app.module.ts
- [ ] GachaModule imported in app.module.ts
- [ ] tutorAPI.ts created
- [ ] gachaAPI.ts created
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] AI Tutor responds (mock or real)
- [ ] Gacha pulls work
- [ ] Hanzi Writer renders
- [ ] Animations smooth (60fps)

---

**🎊 You're ready to build an amazing anime learning platform! 加油!**
