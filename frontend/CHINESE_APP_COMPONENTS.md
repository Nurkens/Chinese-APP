# Chinese Learning App - Frontend Components

## Overview
This project now includes two beautifully designed screens for a Chinese learning application, built with React, TypeScript, and Tailwind CSS.

## Components Created

### 1. WelcomeScreen
- **Path**: [src/components/WelcomeScreen.tsx](src/components/WelcomeScreen.tsx)
- **Route**: `/welcome`
- **Features**:
  - Peaceful, welcoming design with soft gradients
  - Glassmorphism effects
  - Three action buttons: Log In, Sign Up, Continue as Guest
  - Panda mascot placeholder (🐼)
  - Mobile-first responsive design

### 2. Dashboard
- **Path**: [src/components/Dashboard.tsx](src/components/Dashboard.tsx)
- **Route**: `/dashboard`
- **Features**:
  - Dark theme with warm golden accents
  - User profile section with panda avatar
  - Streak counter (12-day streak) with flame icon
  - HSK level indicator (HSK 3)
  - Today's character display (火 - huǒ/fire)
  - Progress bar showing words learned (550/1200)
  - Bottom navigation with 4 tabs:
    - Menu (Home icon)
    - Scroll (BookOpen icon)
    - Goals (Target icon)
    - Profile (User icon)

## Tech Stack
- **React** 19.0.0
- **TypeScript** ~5.9.0
- **Tailwind CSS** (latest)
- **Lucide React** (for icons)
- **Ionic React** (for mobile framework)

## Design Features
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Gradients**: Smooth color transitions for depth
- **Shadows**: Soft, layered shadows for elevation
- **Rounded Corners**: Modern, friendly UI with rounded elements
- **Mobile-First**: Optimized for phone screens but works on desktop
- **Color Palette**:
  - Primary: `#D9903F` (warm orange-gold)
  - Dark backgrounds with stone/amber tones
  - Translucent overlays for depth

## How to Run

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - Welcome Screen: `http://localhost:5173/welcome`
   - Dashboard: `http://localhost:5173/dashboard`

## Navigation Routes
- `/` - Redirects to `/welcome`
- `/welcome` - Welcome/Login screen
- `/dashboard` - Main dashboard after login

## Customization

### Colors
Colors are defined in [tailwind.config.js](tailwind.config.js):
```javascript
colors: {
  primary: '#D9903F',
  'dark-bg': '#1a1410',
}
```

### Adding Real Images
Replace emoji placeholders with actual images:
- Panda character image in WelcomeScreen
- Background images for both screens
- Character illustrations for the dashboard

### Connecting Navigation
The buttons in WelcomeScreen don't navigate yet. You can add navigation like this:

```typescript
import { useHistory } from 'react-router-dom';

const WelcomeScreen = () => {
  const history = useHistory();

  return (
    <button onClick={() => history.push('/dashboard')}>
      Log In
    </button>
  );
};
```

## Next Steps
1. Add authentication logic
2. Connect to backend API
3. Implement actual character learning functionality
4. Add animations and transitions
5. Replace emoji placeholders with real images
6. Add more screens (character details, learning exercises, etc.)

## Notes
- The app is designed to look like a mobile app centered on the screen
- All components are responsive and work on different screen sizes
- Tailwind CSS provides utility classes for quick styling iterations
- Lucide React provides clean, modern icons
