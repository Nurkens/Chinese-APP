# 🔧 Fixed Installation Commands

## Problem Found

The package versions I specified didn't exist:
- ❌ `hanzi-writer@4.0.1` - doesn't exist
- ❌ `pixi.js@8.6.7` - doesn't exist

## ✅ Corrected Versions

I've updated `frontend/package.json` with the correct versions:
- ✅ `hanzi-writer@3.5.0` - latest stable
- ✅ `pixi.js@7.4.2` - stable version
- ✅ `framer-motion@11.15.0` - correct
- ✅ `pixi-live2d-display@0.5.0` - correct

## 🚀 Run These Commands Now

Open PowerShell in `C:\Users\nurke\chinese-app\frontend` and run:

```powershell
# Clean install
rm -rf node_modules, package-lock.json

# Install all dependencies
npm install --legacy-peer-deps
```

**OR** install packages individually:

```powershell
npm install framer-motion@11.15.0 --save --legacy-peer-deps
npm install hanzi-writer@3.5.0 --save --legacy-peer-deps
npm install pixi.js@7.4.2 --save --legacy-peer-deps
npm install pixi-live2d-display@0.5.0 --save --legacy-peer-deps
```

## ✅ Verify Installation

After installation, check:

```powershell
# Should see all 4 packages
ls node_modules | Select-String -Pattern "framer|hanzi|pixi"
```

Expected output:
```
framer-motion
hanzi-writer
pixi-live2d-display
pixi.js
```

## 🎯 Then Start Servers

**Terminal 1 - Backend:**
```bash
cd C:\Users\nurke\chinese-app\backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd C:\Users\nurke\chinese-app\frontend
npm run dev
```

## 🎮 Test Features

Open http://localhost:5173 and click:
- 🌸 **AI Tutor** - Should open visual novel interface
- 🎴 **Character Wish** - Should show gacha system
- ✍️ **Hanzi Practice** - Should show drawing canvas

加油! 🚀
