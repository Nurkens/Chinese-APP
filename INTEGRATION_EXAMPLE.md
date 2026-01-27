# 🎮 Integration Example - Adding Anime Features to Dashboard

## Quick Start: Add AI Tutor and Gacha to Dashboard

### Step 1: Update Dashboard.tsx

Add these imports at the top of `frontend/src/components/Dashboard.tsx`:

```typescript
import { useState } from 'react';
import AITutor from './anime/AITutor/AITutor';
import GachaSystem from './anime/Gacha/GachaSystem';
import HanziWriter from './anime/HanziPractice/HanziWriter';
import { tutorAPI } from '../services/tutorAPI';
import { gachaAPI } from '../services/gachaAPI';
import type { PityState } from '../types/gacha.types';
import type { HanziDrawingResult } from '../types/battle.types';
```

### Step 2: Add State Management

Inside your Dashboard component:

```typescript
const Dashboard: React.FC = () => {
  // Existing state...
  const [activeTab, setActiveTab] = useState<'menu' | 'scroll' | 'map' | 'goals' | 'profile' | 'tutor' | 'gacha' | 'practice'>('menu');

  // NEW: Anime module states
  const [showTutor, setShowTutor] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [pityState, setPityState] = useState<PityState | null>(null);
  const [spiritStones, setSpiritStones] = useState(1600); // Mock value

  // Load pity state on mount
  useEffect(() => {
    const loadGachaData = async () => {
      try {
        const pity = await gachaAPI.getPityState();
        setPityState(pity);
      } catch (error) {
        console.error('Failed to load gacha data:', error);
      }
    };
    loadGachaData();
  }, []);

  // Handle gacha pull
  const handleGachaPull = async (pullType: 'single' | 'ten') => {
    try {
      const result = await gachaAPI.pull(pullType);
      setSpiritStones((prev) => prev - result.spiritStonesSpent);

      // Update pity state
      const newPity = await gachaAPI.getPityState();
      setPityState(newPity);

      return result;
    } catch (error) {
      console.error('Gacha pull failed:', error);
      throw error;
    }
  };

  // Handle hanzi practice completion
  const handlePracticeComplete = (result: HanziDrawingResult) => {
    console.log('Practice complete:', result);
    // Award spirit stones based on accuracy
    const reward = Math.floor(result.accuracy / 10) * 10;
    setSpiritStones((prev) => prev + reward);
    alert(`Great job! You earned ${reward} Spirit Stones!`);
  };

  // ... rest of component
};
```

### Step 3: Add Navigation Buttons

Update your navigation sidebar to include new buttons:

```typescript
{/* Existing navigation */}
<nav className="space-y-4">
  {/* ... existing buttons ... */}

  {/* NEW: AI Tutor Button */}
  <motion.button
    onClick={() => setShowTutor(true)}
    whileHover={{ scale: 1.05, x: 5 }}
    whileTap={{ scale: 0.95 }}
    className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
  >
    <span className="text-2xl">🌸</span>
    <span>AI Tutor (小美)</span>
  </motion.button>

  {/* NEW: Gacha Button */}
  <motion.button
    onClick={() => setShowGacha(true)}
    whileHover={{ scale: 1.05, x: 5 }}
    whileTap={{ scale: 0.95 }}
    className="w-full p-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
  >
    <span className="text-2xl">🎴</span>
    <div className="text-left">
      <div>Character Wish</div>
      <div className="text-xs opacity-90">💎 {spiritStones} Spirit Stones</div>
    </div>
  </motion.button>

  {/* NEW: Hanzi Practice Button */}
  <motion.button
    onClick={() => setShowPractice(true)}
    whileHover={{ scale: 1.05, x: 5 }}
    whileTap={{ scale: 0.95 }}
    className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
  >
    <span className="text-2xl">✍️</span>
    <span>Hanzi Practice</span>
  </motion.button>
</nav>
```

### Step 4: Render Anime Components

At the end of your Dashboard component's return statement:

```typescript
return (
  <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100">
    {/* ... existing dashboard content ... */}

    {/* AI Tutor Modal */}
    {showTutor && (
      <AITutor
        userId={user?.id || 'guest'}
        initialBackground="classroom"
        onClose={() => setShowTutor(false)}
      />
    )}

    {/* Gacha System Modal */}
    {showGacha && pityState && (
      <GachaSystem
        userId={user?.id || 'guest'}
        spiritStones={spiritStones}
        pityState={pityState}
        onPull={handleGachaPull}
        onClose={() => setShowGacha(false)}
      />
    )}

    {/* Hanzi Practice Modal */}
    {showPractice && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPractice(false)}
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#D4AF37',
              color: '#1A0E2E',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              fontWeight: 'bold',
              zIndex: 10,
            }}
          >
            ✕
          </button>
          <HanziWriter
            character="人"
            onComplete={handlePracticeComplete}
            showHints={true}
            showOutline={true}
            size={500}
          />
        </div>
      </div>
    )}
  </div>
);
```

---

## Alternative: Create Dedicated Pages

### Option A: Create Separate Route for AI Tutor

Create `frontend/src/components/TutorPage.tsx`:

```typescript
import React from 'react';
import AITutor from './anime/AITutor/AITutor';
import { useNavigate } from 'react-router-dom';

const TutorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AITutor
      userId="current-user-id"
      initialBackground="classroom"
      onClose={() => navigate('/dashboard')}
    />
  );
};

export default TutorPage;
```

### Option B: Tab-Based Navigation

Add to your existing tab system in Dashboard:

```typescript
// In your tab content rendering:
{activeTab === 'tutor' && (
  <div className="min-h-screen">
    <AITutor
      userId={user?.id || 'guest'}
      initialBackground="classroom"
      onClose={() => setActiveTab('menu')}
    />
  </div>
)}

{activeTab === 'gacha' && pityState && (
  <GachaSystem
    userId={user?.id || 'guest'}
    spiritStones={spiritStones}
    pityState={pityState}
    onPull={handleGachaPull}
    onClose={() => setActiveTab('menu')}
  />
)}

{activeTab === 'practice' && (
  <div className="p-8 flex justify-center">
    <HanziWriter
      character="人"
      onComplete={handlePracticeComplete}
      showHints={true}
      showOutline={true}
      size={500}
    />
  </div>
)}
```

---

## Testing the Features

### 1. Test AI Tutor

```bash
# In one terminal - backend
cd backend
npm run start:dev

# In another terminal - frontend
cd frontend
npm run dev
```

Navigate to http://localhost:5173, click "AI Tutor (小美)" button:
- Type "hello" - should get 你好 response
- Type "thank you" - should get 谢谢 response
- Watch for emotion changes and particle effects

### 2. Test Gacha System

Click "Character Wish" button:
- Click "Wish x1" (costs 160 stones)
- Watch the pull animation sequence
- See card reveal with rarity
- Check pity counter updates

### 3. Test Hanzi Practice

Click "Hanzi Practice" button:
- Draw the character 人 with your mouse
- See gold particles on correct strokes
- Red flash on mistakes
- Fireworks on completion

---

## Environment Setup

Add to `backend/.env`:

```env
# OpenAI API Key (optional - will use mock responses if not set)
OPENAI_API_KEY=sk-your-key-here

# Existing vars...
DATABASE_URL="postgresql://postgres:password@localhost:5433/chinese_learning?schema=public"
JWT_SECRET=your-secret-key
```

---

## Quick Feature Flags

If you want to enable/disable features:

```typescript
// At top of Dashboard
const FEATURES = {
  AI_TUTOR: true,
  GACHA: true,
  HANZI_PRACTICE: true,
  BATTLE_SYSTEM: false, // Coming soon
};

// Then in navigation:
{FEATURES.AI_TUTOR && (
  <button onClick={() => setShowTutor(true)}>
    AI Tutor
  </button>
)}
```

---

## Debugging Tips

### Backend Not Responding

```bash
# Check if backend is running
curl http://localhost:3000/tutor/emotion/joy

# Should return JSON with emotion data
```

### Frontend Components Not Rendering

```bash
# Check browser console (F12)
# Look for import errors or missing dependencies
```

### Animations Laggy

```typescript
// Reduce particle count in EmotionRenderer.tsx
{Array.from({ length: 4 }).map(...)} // Instead of 8
```

---

## 🎊 You're All Set!

Your anime-oriented Chinese learning platform is ready! Users can now:
- 🌸 Chat with AI tutor 小美
- 🎴 Pull for character cards
- ✍️ Practice writing Hanzi
- 🗺️ Explore the 3D learning map (existing)
- 📚 Study vocabulary (existing)
- 🎯 Track goals (existing)

加油! (Keep going!) 🚀
