# 🔧 How to Fix Anime Dependencies Issue

## Problem

The anime feature packages (framer-motion, hanzi-writer, pixi.js) are not installing via normal `npm install` due to React 19 peer dependency conflicts.

## ✅ Solution: Run PowerShell Script

### Step 1: Open PowerShell as Administrator

1. Press `Windows + X`
2. Click "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" on the UAC prompt

### Step 2: Run the Installation Script

Copy and paste this command into PowerShell:

```powershell
cd C:\Users\nurke\chinese-app
.\INSTALL_ANIME_PACKAGES.ps1
```

If you get an execution policy error, run this first:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

Then try the installation script again.

### Step 3: Verify Installation

After the script completes, check for these lines:

```
✅ framer-motion - INSTALLED
✅ hanzi-writer - INSTALLED
✅ pixi.js - INSTALLED
✅ pixi-live2d-display - INSTALLED
```

## Alternative: Manual Installation

If the PowerShell script doesn't work, install each package manually:

```powershell
cd C:\Users\nurke\chinese-app\frontend

npm install framer-motion@11.15.0 --save --legacy-peer-deps
npm install hanzi-writer@4.0.1 --save --legacy-peer-deps
npm install pixi.js@8.6.7 --save --legacy-peer-deps
npm install pixi-live2d-display@0.5.0 --save --legacy-peer-deps
```

## After Installation

### Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Test the Features

1. Open http://localhost:5173
2. Login or use guest mode
3. Look for these new buttons in the navigation sidebar:
   - 🌸 **AI Tutor (小美)** - Purple gradient button
   - 🎴 **Character Wish** - Yellow gradient button
   - ✍️ **Hanzi Practice** - Blue gradient button

4. Click each button to test:
   - **AI Tutor**: Type "hello" and get 你好 response
   - **Gacha**: Click "Wish x1" to pull a character card
   - **Hanzi Practice**: Draw the character 人 with your mouse

## Troubleshooting

### Issue: "Cannot be loaded because running scripts is disabled"

Run this in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Packages still not installing

You may have a React 19 compatibility issue. Options:

**Option A: Force install (may cause warnings)**
```bash
npm install --force
```

**Option B: Downgrade to React 18**

Edit `frontend/package.json`:
```json
"react": "^18.3.1",
"react-dom": "^18.3.1",
"@types/react": "^18.3.12",
"@types/react-dom": "^18.3.3"
```

Then:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Module not found" errors in browser

1. Stop the frontend dev server (Ctrl+C)
2. Delete .vite cache: `rm -rf node_modules/.vite`
3. Restart: `npm run dev`

## What's Included

### AI Tutor Features
- Chat with 小美 (Xiaomei) in visual novel style
- Typewriter dialogue effects
- Emotion-based animations (joy, study, surprised)
- Chinese learning with hanzi, pinyin, translation
- Dynamic backgrounds (classroom, library, garden)

### Gacha System Features
- Spirit Stones currency (💎)
- Single pull (160 stones) and 10x pull (1600 stones)
- Pity system (guaranteed SSR at 90 pulls)
- Rarity tiers: SSR (gold), SR (purple), R (blue)
- Animated card reveals

### Hanzi Practice Features
- Stroke order practice with hanzi-writer
- Traditional calligraphy paper background
- Gold particle effects on correct strokes
- Progress tracking and accuracy scoring
- Earn Spirit Stones for practice

## Current Status

### ✅ Completed
- Backend tutor service with mock responses
- Backend gacha service with pity system
- Frontend components created
- Dashboard integration added
- API services created
- TypeScript types defined

### ⏳ Waiting For
- Dependency installation (you're doing this now!)

### 🎯 Next After Installation
1. Test all three anime features
2. Optionally add OpenAI API key for real GPT-4 responses
3. Add Live2D models for character animations
4. Create more Hanzi practice levels

## Need Help?

If you're still stuck after trying these steps, take a screenshot of the error message and I'll help debug further.

加油! 🚀
