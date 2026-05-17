# Chinese Learning App with AI Tutor

A modern web and mobile application for learning Chinese with an AI-powered tutor character. Features interactive lessons, spaced repetition, goal tracking, and social features.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Ionic
- **Backend**: NestJS 11 + PostgreSQL + Prisma ORM
- **Mobile**: Capacitor 8 (Android/iOS)
- **AI**: OpenAI GPT-3.5-turbo with intelligent fallback responses
- **Deployment**: Docker, Railway, Render, or Vercel

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL and Redis (or use Docker)

### Development Setup

1. **Clone and install dependencies**:
   ```bash
   cd ChineseProject
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

2. **Start services** (from ChineseProject root):
   ```bash
   docker-compose up -d
   ```

3. **Backend** (localhost:3000):
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Frontend** (localhost:5173):
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the app**:
   - Open http://localhost:5173 in your browser
   - Login as guest or create an account
   - Click the AI character to start learning!

## Optional: AI Enhancement

Add OpenAI API key for advanced AI responses:
1. Get key from https://platform.openai.com/api-keys
2. Add to `backend/.env`: `OPENAI_API_KEY=sk-...`
3. Restart backend

System uses intelligent mock responses as fallback if no API key is set.

## Project Structure

- `backend/` - NestJS REST API with database models
- `frontend/` - React web application with Vite
- `docker-compose.yml` - Local development services

## Features

- ✨ AI Tutor character with emotion responses
- 📚 1051 HSK words across 4 proficiency levels
- 🎯 Goal setting and progress tracking
- 🔄 Spaced Repetition System (SRS)
- 👥 Social features and friends
- 🎰 Gacha system for rewards
- 📱 Mobile support with Capacitor
- 🌙 Dark theme UI

## License

MIT
