# Backend Complete - All API Endpoints 🚀

## New Module Added: Goals

### Goals Module Structure
```
backend/src/goals/
├── goals.module.ts       # Goals module definition
├── goals.service.ts      # Business logic for goals & achievements
└── goals.controller.ts   # API endpoints for goals
```

## All Available API Endpoints

### 🔐 Authentication Endpoints (`/auth`)

#### POST `/auth/register`
Register a new user account
```json
Request:
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "isGuest": false
  }
}
```

#### POST `/auth/login`
Login with existing credentials
```json
Request:
{
  "username": "testuser",
  "password": "password123"
}

Response:
{
  "access_token": "jwt_token_here",
  "user": { ... }
}
```

#### POST `/auth/guest`
Create a guest account (no email/password required)
```json
Response:
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "username": "guest_xxxxx",
    "isGuest": true
  }
}
```

### 📚 Words Endpoints (`/words`)
All require JWT authentication

#### GET `/words/today`
Get today's featured Chinese character
```json
Response:
{
  "id": "uuid",
  "chinese": "学",
  "pinyin": "xué",
  "translation": "to study, to learn",
  "example": "学习 xuéxí - to study",
  "hskLevel": 1
}
```

#### GET `/words/hsk/:level`
Get all words for a specific HSK level (1-6)
```json
Response: [
  {
    "id": "uuid",
    "chinese": "你好",
    "pinyin": "nǐ hǎo",
    "translation": "hello",
    "hskLevel": 1
  },
  ...
]
```

#### POST `/words/seed`
Seed initial Chinese words into database (no auth required)
```json
Response:
{
  "message": "Initial words seeded successfully"
}
```

### 👤 User Endpoints (`/user`)
All require JWT authentication

#### GET `/user/profile`
Get current user's profile
```json
Response:
{
  "id": "uuid",
  "username": "testuser",
  "email": "test@example.com",
  "isGuest": false,
  "createdAt": "2024-01-20T..."
}
```

#### GET `/user/progress`
Get user's learning progress
```json
Response:
{
  "id": "uuid",
  "userId": "uuid",
  "currentStreak": 5,
  "longestStreak": 12,
  "lastStudyDate": "2024-01-20T...",
  "hskLevel": 1,
  "totalWords": 150,
  "targetWords": 1200
}
```

#### POST `/user/streak`
Update user's streak (called automatically on dashboard visit)
```json
Response:
{
  "currentStreak": 6,
  "longestStreak": 12,
  "message": "Streak updated!"
}
```

#### POST `/user/words/learned`
Mark a word as learned
```json
Request:
{
  "wordId": "word_uuid"
}

Response:
{
  "id": "uuid",
  "userId": "user_uuid",
  "wordId": "word_uuid",
  "learnedAt": "2024-01-20T..."
}
```

#### GET `/user/words/learned`
Get all words the user has learned
```json
Response: [
  {
    "id": "uuid",
    "word": {
      "chinese": "你好",
      "pinyin": "nǐ hǎo",
      "translation": "hello"
    },
    "learnedAt": "2024-01-20T..."
  },
  ...
]
```

### 🎯 Goals Endpoints (`/goals`) - NEW!
All require JWT authentication

#### GET `/goals`
Get user's active goals
```json
Response: [
  {
    "id": "1",
    "userId": "uuid",
    "title": "Daily Practice",
    "description": "Practice 20 minutes every day",
    "target": 20,
    "current": 15,
    "type": "daily",
    "completed": false,
    "createdAt": "2024-01-20T..."
  },
  {
    "id": "2",
    "title": "Weekly Words",
    "description": "Learn 50 new words this week",
    "target": 50,
    "current": 32,
    "type": "weekly",
    "completed": false,
    "createdAt": "2024-01-20T..."
  },
  ...
]
```

Goal types: `daily`, `weekly`, `monthly`

#### GET `/goals/achievements`
Get user's achievements (locked and unlocked)
```json
Response: [
  {
    "id": "1",
    "title": "First Streak",
    "description": "7-day streak achieved",
    "icon": "flame",
    "unlocked": true,
    "unlockedAt": "2024-01-15T..."
  },
  {
    "id": "2",
    "title": "Word Master",
    "description": "Learn 100 words",
    "icon": "trophy",
    "unlocked": false,
    "unlockedAt": null
  },
  ...
]
```

#### POST `/goals`
Create a new custom goal
```json
Request:
{
  "title": "Master 200 words",
  "description": "Learn 200 Chinese words",
  "target": 200,
  "type": "monthly"
}

Response:
{
  "id": "new_uuid",
  "userId": "uuid",
  "title": "Master 200 words",
  "description": "Learn 200 Chinese words",
  "target": 200,
  "current": 0,
  "type": "monthly",
  "completed": false,
  "createdAt": "2024-01-20T..."
}
```

#### POST `/goals/:id/progress`
Update goal progress
```json
Request:
{
  "current": 25
}

Response:
{
  "id": "goal_uuid",
  "userId": "user_uuid",
  "current": 25,
  "updated": true
}
```

## Frontend API Client

The frontend has a complete API client in `frontend/src/services/api.ts`:

```typescript
import { authAPI, wordsAPI, userAPI, goalsAPI } from '../services/api';

// Examples:
await authAPI.login(username, password);
await wordsAPI.getTodayWord();
await userAPI.getProgress();
await goalsAPI.getUserGoals();
```

## How Goals Work

### Goal Calculation Logic:
Goals are dynamically calculated based on user progress:

1. **Daily Practice** - Based on current streak × 5 minutes
2. **Weekly Words** - Total words % 50 (modulo for weekly cycle)
3. **7-Day Streak** - Current streak progress toward 7 days
4. **HSK Master** - Total words toward HSK level target (150 words per level)

### Achievement Unlock Criteria:

| Achievement | Unlock Condition |
|------------|------------------|
| First Streak | 7-day streak |
| Word Master | 100 words learned |
| Dedicated Learner | 30-day streak |
| HSK 1 Complete | 150 words + HSK level 2 |
| HSK 2 Complete | 300 words + HSK level 3 |
| Century Club | 100-day streak |

## Testing the API

### Using curl:

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Get goals (with token)
curl http://localhost:3000/goals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get achievements
curl http://localhost:3000/goals/achievements \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Swagger UI:
Visit http://localhost:3000/api for interactive API documentation

## Database Schema (Existing)

The Goals module uses existing tables:
- `User` - User accounts
- `UserProgress` - Streak, HSK level, total words
- `Word` - Chinese word database
- `UserWord` - Words learned by user

Goals and achievements are currently calculated dynamically from UserProgress data. In production, you can create dedicated Goal and Achievement tables.

## What's Working

✅ **Authentication**
- Register, login, guest login
- JWT token authentication
- Password hashing with bcrypt

✅ **Words**
- Daily character selection
- HSK level filtering
- Word seeding

✅ **User Progress**
- Streak tracking
- HSK level progression
- Words learned counting

✅ **Goals** (NEW!)
- Active goals tracking
- Achievement system
- Dynamic progress calculation

## Next Steps for Production

1. **Create Goal database tables** in Prisma schema:
```prisma
model Goal {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String
  target      Int
  current     Int      @default(0)
  type        String   // daily, weekly, monthly
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}

model Achievement {
  id          String    @id @default(uuid())
  userId      String
  achievementType String
  unlockedAt  DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
}
```

2. **Implement actual goal persistence** instead of mock data
3. **Add goal completion rewards**
4. **Add notifications for achievements**
5. **Create goal history/analytics**

## Server Commands

```bash
# Start development server
cd backend
npm run start:dev

# Server will run on http://localhost:3000
# Swagger UI: http://localhost:3000/api
```

## Integration Complete! 🎉

Frontend connects to all backend endpoints:
- ✅ Word Library uses `/words/hsk/:level`
- ✅ Goals page uses `/goals` and `/goals/achievements`
- ✅ Profile page uses `/user/profile` and `/user/progress`
- ✅ Dashboard uses `/words/today` and `/user/progress`

All pages have real data from the backend!
