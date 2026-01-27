# 🧪 Test & Verify Setup

## ✅ Database is Seeded!

Your database now has **578 Chinese words**:
- HSK 1: 124 words
- HSK 2: 148 words
- HSK 3: 296 words
- HSK 4: 10 words

## 🔍 Quick Test

### 1. Test Backend API (should work)

Open PowerShell and run:

```powershell
# Test if backend is responding
curl http://localhost:3000/words/today

# Test HSK 1 words
curl http://localhost:3000/words/hsk/1
```

You should see JSON data with Chinese words.

### 2. Test Frontend in Browser

**Open Browser DevTools (F12):**

1. Go to http://localhost:5173
2. Click "Word Library" in the navigation
3. Open **Console** tab (F12)
4. Look for any errors (should be red text)

**Check Network Tab:**
1. Open **Network** tab (F12)
2. Click on HSK level button (1, 2, 3, or 4)
3. Look for a request to `/words/hsk/1` (or 2, 3, 4)
4. Click on that request
5. Check if **Status** is 200 (success)
6. Check **Preview** tab - should show array of words

## 🐛 If Word Library is Empty

### Fix 1: Refresh the Page
1. Press `Ctrl + R` or `F5` to refresh
2. Click "Word Library" again
3. Check if words appear

### Fix 2: Clear Browser Cache
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page (`Ctrl + R`)

### Fix 3: Hard Reload
1. Press `Ctrl + Shift + R` (hard reload)
2. Or press `F12`, then right-click refresh button → "Empty Cache and Hard Reload"

### Fix 4: Check Backend is Running
```powershell
# Check if backend process is running on port 3000
netstat -ano | findstr :3000
```

If you see output, backend is running. If not:

```powershell
cd C:\Users\nurke\chinese-app\backend
npm run start:dev
```

### Fix 5: Restart Everything
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Restart using the quick start script
cd C:\Users\nurke\chinese-app
.\QUICK_START.ps1
```

## 📊 Expected Behavior

### Dashboard Page
- Shows "人 - rén / person" (or another random word)
- Progress: 0/1200 words
- Click "REVIEW 15 WORDS" → navigates to Word Library

### Word Library Page
- Shows 4 HSK level buttons: **1, 2, 3, 4** (no 5 or 6)
- Click HSK 1 → shows ~124 words in cards
- Click HSK 2 → shows ~148 words
- Click HSK 3 → shows ~296 words
- Click HSK 4 → shows ~10 words
- Search bar works to filter words

## 🔧 Debug Checklist

Run through this checklist:

- [ ] Backend running on port 3000? (`netstat -ano | findstr :3000`)
- [ ] Frontend running on port 5173? (Browser opens http://localhost:5173)
- [ ] Browser DevTools Console shows no errors? (F12 → Console)
- [ ] Network tab shows successful requests to `/words/hsk/1`? (F12 → Network)
- [ ] Database has words? (Run: `curl http://localhost:3000/words/hsk/1`)

## 💡 Most Common Issue

**Symptom**: Word Library page is blank, no words show up.

**Cause**: Frontend loaded before backend finished starting.

**Solution**:
1. Wait 5 more seconds
2. Click a different HSK level button (try 2, 3, or 4)
3. Or refresh the page (`Ctrl + R`)

## ✅ Verify It's Working

You'll know everything is working when:

1. **Dashboard** shows today's character (人, 是, 学, etc.)
2. **Review button** takes you to Word Library
3. **Word Library** shows HSK 1-4 buttons
4. **Clicking HSK 1** shows Chinese character cards
5. **Search bar** filters words when you type

## 🎯 Next Steps

Once Word Library shows words:
- Click any word card to see details
- Try the search bar (search "person" or "人")
- Switch between HSK levels
- Test the anime features (AI Tutor, Gacha, Hanzi Practice)

---

**Need more help?**
Check browser Console (F12) for error messages and share them.
