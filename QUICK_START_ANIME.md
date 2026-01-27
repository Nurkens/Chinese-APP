# 🚀 Quick Start - Anime Features

## ⚡ 5-Minute Integration

### Step 1: Verify Installation ✅

All dependencies are already installed:
- ✅ Backend: `openai` package
- ✅ Frontend: `hanzi-writer`, `pixi.js`, `pixi-live2d-display`
- ✅ Modules: `TutorModule`, `GachaModule` imported in `app.module.ts`

### Step 2: Add One Button to Dashboard

Open `frontend/src/components/Dashboard.tsx` and add:

```typescript
// 1. Add import at top
import AITutor from './anime/AITutor/AITutor';

// 2. Add state
const [showTutor, setShowTutor] = useState(false);

// 3. Add button in your navigation
<button
  onClick={() => setShowTutor(true)}
  className="p-4 bg-purple-500 text-white rounded-lg"
>
  🌸 Talk to AI Tutor
</button>

// 4. Add component at end of return
{showTutor && (
  <AITutor
    userId="guest"
    initialBackground="classroom"
    onClose={() => setShowTutor(false)}
  />
)}
```

### Step 3: Run & Test

```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173, click the button, and type "hello" 👋

---

## 🎮 All Features - One File

Copy this entire component to test everything:

<details>
<summary>Click to expand complete example</summary>

```typescript
// frontend/src/components/AnimeDemoPage.tsx
import React, { useState, useEffect } from 'react';
import AITutor from './anime/AITutor/AITutor';
import GachaSystem from './anime/Gacha/GachaSystem';
import HanziWriter from './anime/HanziPractice/HanziWriter';
import { gachaAPI } from '../services/gachaAPI';
import type { PityState } from '../types/gacha.types';

const AnimeDemoPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<'menu' | 'tutor' | 'gacha' | 'hanzi'>('menu');
  const [pityState, setPityState] = useState<PityState | null>(null);
  const [spiritStones, setSpiritStones] = useState(5000);

  useEffect(() => {
    gachaAPI.getPityState().then(setPityState).catch(console.error);
  }, []);

  const handleGachaPull = async (pullType: 'single' | 'ten') => {
    const result = await gachaAPI.pull(pullType);
    setSpiritStones((prev) => prev - result.spiritStonesSpent);
    const newPity = await gachaAPI.getPityState();
    setPityState(newPity);
    return result;
  };

  if (activeFeature === 'tutor') {
    return (
      <AITutor
        userId="demo-user"
        initialBackground="classroom"
        onClose={() => setActiveFeature('menu')}
      />
    );
  }

  if (activeFeature === 'gacha' && pityState) {
    return (
      <GachaSystem
        userId="demo-user"
        spiritStones={spiritStones}
        pityState={pityState}
        onPull={handleGachaPull}
        onClose={() => setActiveFeature('menu')}
      />
    );
  }

  if (activeFeature === 'hanzi') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 p-8">
        <button
          onClick={() => setActiveFeature('menu')}
          className="mb-4 px-6 py-3 bg-white text-purple-900 rounded-lg font-bold"
        >
          ← Back
        </button>
        <div className="flex justify-center">
          <HanziWriter
            character="人"
            onComplete={(result) => {
              const reward = Math.floor(result.accuracy);
              setSpiritStones((prev) => prev + reward);
              alert(`Great! +${reward} Spirit Stones`);
            }}
            showHints={true}
            showOutline={true}
            size={500}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-center text-white mb-4">
          🎮 Anime Learning Platform
        </h1>
        <p className="text-xl text-center text-purple-200 mb-12">
          Genshin Impact × Chinese Learning
        </p>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-8 border-2 border-yellow-400">
          <div className="text-center">
            <div className="text-yellow-400 text-lg mb-2">Spirit Stones</div>
            <div className="text-5xl font-bold text-white">💎 {spiritStones}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Tutor Card */}
          <button
            onClick={() => setActiveFeature('tutor')}
            className="group p-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl hover:scale-105 transition-all border-4 border-yellow-400"
          >
            <div className="text-7xl mb-4">🌸</div>
            <div className="text-2xl font-bold text-white mb-2">AI Tutor</div>
            <div className="text-purple-100">
              Chat with 小美<br/>
              Learn Chinese naturally
            </div>
          </button>

          {/* Gacha Card */}
          <button
            onClick={() => setActiveFeature('gacha')}
            className="group p-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl shadow-2xl hover:scale-105 transition-all border-4 border-yellow-400"
          >
            <div className="text-7xl mb-4">🎴</div>
            <div className="text-2xl font-bold text-white mb-2">Gacha</div>
            <div className="text-orange-100">
              Wish for characters<br/>
              {pityState?.pullsSinceLastSSR || 0}/90 to SSR
            </div>
          </button>

          {/* Hanzi Practice Card */}
          <button
            onClick={() => setActiveFeature('hanzi')}
            className="group p-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-2xl hover:scale-105 transition-all border-4 border-yellow-400"
          >
            <div className="text-7xl mb-4">✍️</div>
            <div className="text-2xl font-bold text-white mb-2">Hanzi</div>
            <div className="text-blue-100">
              Practice writing<br/>
              Master stroke order
            </div>
          </button>
        </div>

        <div className="mt-12 text-center text-purple-200">
          <p className="text-sm">Made with React + TypeScript + Framer Motion</p>
          <p className="text-lg font-bold mt-2">加油! (Keep going!) 🚀</p>
        </div>
      </div>
    </div>
  );
};

export default AnimeDemoPage;
```

</details>

Then add to your router:

```typescript
import AnimeDemoPage from './components/AnimeDemoPage';

// In your routes:
<Route path="/anime-demo" element={<AnimeDemoPage />} />
```

Visit: http://localhost:5173/anime-demo

---

## 🎯 Feature Status

| Feature | Status | Ready to Use |
|---------|--------|-------------|
| AI Tutor | ✅ Complete | Yes |
| Gacha System | ✅ Complete | Yes |
| Hanzi Practice | ✅ Complete | Yes |
| Battle System | ⚙️ Logic Only | Needs UI integration |
| Live2D Models | 📝 Setup Guide | Requires model files |

---

## 🐛 Troubleshooting

### "Cannot find module 'openai'"
✅ Already installed - restart TypeScript server in VS Code

### "framer-motion not found"
```bash
cd frontend && npm install framer-motion --save
```

### Backend not responding
```bash
# Check if running:
curl http://localhost:3000/tutor/emotion/joy

# Should return JSON
```

### Components not rendering
- Check browser console (F12)
- Verify imports are correct
- Make sure both backend + frontend are running

---

## 📖 Full Documentation

- **Architecture**: [ANIME_ARCHITECTURE.md](ANIME_ARCHITECTURE.md)
- **Setup Guide**: [ANIME_SETUP_GUIDE.md](ANIME_SETUP_GUIDE.md)
- **Integration**: [INTEGRATION_EXAMPLE.md](INTEGRATION_EXAMPLE.md)
- **Summary**: [ANIME_FEATURES_SUMMARY.md](ANIME_FEATURES_SUMMARY.md)

---

## 🎊 That's It!

You now have:
- ✅ AI Tutor with GPT-4
- ✅ Gacha with pity system
- ✅ Hanzi practice with particles
- ✅ Genshin Impact UI
- ✅ Full TypeScript types
- ✅ Production-ready code

**Start with one feature, then add more!** 🚀

加油! 💪
