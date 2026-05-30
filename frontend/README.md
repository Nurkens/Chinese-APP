# Chinese Learning App - Frontend

React web application built with TypeScript, Vite, Tailwind CSS, and Ionic for desktop and mobile browsers.

## Setup

```bash
npm install
```

## Running

```bash
# Development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

- `src/components/` - React components (screens, modals, widgets)
- `src/pages/` - Page routes
- `src/services/` - API client layer
- `src/contexts/` - React contexts (auth, tutor)
- `src/hooks/` - Custom React hooks
- `src/assets/` - Images, fonts, etc.

## Key Features

- 🔐 Authentication (login, signup, guest, Google OAuth)
- ✨ AI tutor character with emotion animations
- 📚 Word learning with SRS
- 🎯 Goal tracking
- 📱 Responsive design with Ionic components
- 🌙 Dark theme with Tailwind CSS

## Building for Mobile

```bash
# Build for Android/iOS with Capacitor
npm run build
npx cap add android
npx cap open android
```

## License

MIT
