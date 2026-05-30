# Chinese Language Learning App

A gamified, full-stack Chinese language learning application. Users learn HSK
vocabulary through daily characters, spaced repetition, streaks, goals, and
achievements, with an AI tutor and gacha-style rewards to keep practice
engaging.

## Tech Stack

**Backend** (`backend/`)
- [NestJS](https://nestjs.com/) 11 (TypeScript)
- [Prisma](https://www.prisma.io/) ORM with PostgreSQL
- JWT authentication (with guest accounts) + bcrypt
- Swagger/OpenAPI docs

**Frontend** (`frontend/`)
- [Ionic React](https://ionicframework.com/) 8 + React 19 + TypeScript
- [Vite](https://vitejs.dev/) build tooling, Tailwind CSS
- [Capacitor](https://capacitorjs.com/) for native Android/iOS builds
- Animation & visuals: Framer Motion, GSAP, Three.js / react-three-fiber,
  PixiJS, and `hanzi-writer` for stroke-order practice

## Project Structure

```
ChineseProject/
├── backend/              # NestJS API
│   └── src/
│       ├── auth/         # Registration, login, guest accounts, JWT
│       ├── words/        # HSK words, "character of the day", seeding
│       ├── user/         # Profile, progress, streaks, learned words
│       ├── goals/        # Goals & achievements
│       ├── srs/          # Spaced repetition system
│       ├── adaptive/     # Adaptive learning recommendations
│       ├── ai/ + tutor/  # AI tutor ("Xiaomei")
│       ├── friends/      # Social features
│       └── gacha/        # Gamified rewards
├── frontend/             # Ionic + React app
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # App screens
│       ├── contexts/     # React context providers
│       ├── hooks/        # Custom hooks
│       └── services/     # API client (api.ts)
├── docker-compose.yml    # PostgreSQL + app services
├── Dockerfile
└── railway.json          # Railway deployment config
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use the provided `docker-compose.yml`)

### 1. Backend

```bash
cd backend
npm install

# Configure environment — create backend/.env:
#   DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/chinese_app?schema=public"
#   JWT_SECRET="change-this-in-production"
#   PORT=3000

# Set up the database
npx prisma generate
npx prisma migrate dev --name init
npm run seed            # seed initial HSK words

# Run the API (http://localhost:3000)
npm run start:dev
```

Interactive API docs (Swagger UI): http://localhost:3000/api

### 2. Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

### 3. Run with Docker (optional)

```bash
docker-compose up
```

## Key API Endpoints

All endpoints except auth and seeding require a `Bearer` JWT token.

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| POST   | `/auth/register`          | Create an account                    |
| POST   | `/auth/login`             | Log in                               |
| POST   | `/auth/guest`             | Create a guest account               |
| GET    | `/words/today`            | Character of the day                 |
| GET    | `/words/hsk/:level`       | Words for an HSK level (1–6)         |
| POST   | `/words/seed`             | Seed initial words                   |
| GET    | `/user/profile`           | Current user's profile               |
| GET    | `/user/progress`          | Streaks, HSK level, words learned    |
| POST   | `/user/streak`            | Update daily streak                  |
| POST   | `/user/words/learned`     | Mark a word as learned               |
| GET    | `/goals`                  | Active goals                         |
| GET    | `/goals/achievements`     | Locked & unlocked achievements       |

## Scripts

**Backend**
- `npm run start:dev` — dev server with watch
- `npm run build` / `npm run start:prod` — production build & run
- `npm run test` — unit tests
- `npm run seed` — seed the database

**Frontend**
- `npm run dev` — Vite dev server
- `npm run build` — type-check and build
- `npm run test.unit` — Vitest unit tests
- `npm run test.e2e` — Cypress e2e tests

## Mobile Builds

The frontend uses Capacitor. After `npm run build`:

```bash
npx cap sync
npx cap open android   # or: npx cap open ios
```
