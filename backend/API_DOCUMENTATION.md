# Chinese Learning App - Backend API Documentation

## Overview
Backend API для приложения изучения китайского языка. Построен на NestJS с использованием Prisma ORM и PostgreSQL.

## Tech Stack
- **NestJS** - Node.js framework
- **Prisma** - ORM для работы с базой данных
- **PostgreSQL** - База данных
- **JWT** - Аутентификация
- **bcrypt** - Хеширование паролей

## Setup

### 1. Установка зависимостей
```bash
cd backend
npm install
```

### 2. Настройка базы данных
Создайте PostgreSQL базу данных и обновите `.env` файл:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/chinese_app?schema=public"
JWT_SECRET="your-secret-key"
PORT=3000
```

### 3. Миграции Prisma
```bash
# Создать миграцию
npx prisma migrate dev --name init

# Генерация Prisma Client
npx prisma generate

# (Опционально) Открыть Prisma Studio для просмотра данных
npx prisma studio
```

### 4. Seed начальных данных
```bash
# Запустить сервер
npm run start:dev

# В другом терминале
curl -X POST http://localhost:3000/words/seed
```

## API Endpoints

### Authentication Module (`/auth`)

#### POST `/auth/register`
Регистрация нового пользователя

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "john_doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "user@example.com",
    "isGuest": false,
    "progress": {
      "currentStreak": 0,
      "longestStreak": 0,
      "hskLevel": 1,
      "totalWords": 0,
      "targetWords": 1200
    }
  }
}
```

#### POST `/auth/login`
Вход существующего пользователя

**Request:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "user@example.com",
    "isGuest": false,
    "progress": {...}
  }
}
```

#### POST `/auth/guest`
Вход как гость

**Request:**
```json
{
  "username": "guest123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "guest_guest123_1234567890",
    "isGuest": true,
    "progress": {...}
  }
}
```

---

### Words Module (`/words`)
**Все эндпоинты требуют JWT токен в Header: `Authorization: Bearer <token>`**

#### GET `/words/today`
Получить иероглиф дня

**Response:**
```json
{
  "id": "uuid",
  "chinese": "火",
  "pinyin": "huǒ",
  "translation": "fire",
  "example": "火车",
  "examplePinyin": "huǒchē",
  "hskLevel": 1,
  "category": "noun"
}
```

#### GET `/words/hsk/:level`
Получить все слова для конкретного HSK уровня (1-6)

**Example:** `GET /words/hsk/1`

**Response:**
```json
[
  {
    "id": "uuid",
    "chinese": "火",
    "pinyin": "huǒ",
    "translation": "fire",
    "example": "火车",
    "examplePinyin": "huǒchē",
    "hskLevel": 1,
    "category": "noun"
  },
  ...
]
```

#### GET `/words/:id`
Получить конкретное слово по ID

**Response:**
```json
{
  "id": "uuid",
  "chinese": "火",
  "pinyin": "huǒ",
  "translation": "fire",
  "example": "火车",
  "examplePinyin": "huǒchē",
  "hskLevel": 1,
  "category": "noun"
}
```

#### POST `/words/seed`
Заполнить базу данных начальными словами (не требует аутентификации)

**Response:**
```json
{
  "message": "Initial words seeded successfully"
}
```

---

### User Module (`/user`)
**Все эндпоинты требуют JWT токен**

#### GET `/user/profile`
Получить профиль пользователя с прогрессом и последними изученными словами

**Response:**
```json
{
  "id": "uuid",
  "username": "john_doe",
  "email": "user@example.com",
  "isGuest": false,
  "progress": {
    "id": "uuid",
    "currentStreak": 12,
    "longestStreak": 15,
    "lastStudyDate": "2024-01-20T10:00:00Z",
    "hskLevel": 3,
    "totalWords": 550,
    "targetWords": 1200
  },
  "learnedWords": [
    {
      "id": "uuid",
      "mastery": 85,
      "reviewCount": 5,
      "lastReview": "2024-01-20T09:00:00Z",
      "word": {
        "chinese": "火",
        "pinyin": "huǒ",
        "translation": "fire"
      }
    },
    ...
  ]
}
```

#### GET `/user/progress`
Получить только прогресс пользователя

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "currentStreak": 12,
  "longestStreak": 15,
  "lastStudyDate": "2024-01-20T10:00:00Z",
  "hskLevel": 3,
  "totalWords": 550,
  "targetWords": 1200
}
```

#### POST `/user/progress/streak`
Обновить streak пользователя (вызывается при ежедневном входе/изучении)

**Response:**
```json
{
  "id": "uuid",
  "currentStreak": 13,
  "longestStreak": 15,
  "lastStudyDate": "2024-01-20T12:00:00Z",
  ...
}
```

#### PUT `/user/progress`
Обновить прогресс пользователя

**Request:**
```json
{
  "hskLevel": 4,
  "targetWords": 1500
}
```

**Response:**
```json
{
  "id": "uuid",
  "hskLevel": 4,
  "totalWords": 550,
  "targetWords": 1500,
  ...
}
```

#### POST `/user/words/:wordId/learn`
Отметить слово как изученное

**Example:** `POST /user/words/uuid-of-word/learn`

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "wordId": "uuid",
  "mastery": 10,
  "reviewCount": 1,
  "lastReview": "2024-01-20T12:00:00Z"
}
```

#### GET `/user/words/learned`
Получить все изученные слова пользователя

**Response:**
```json
[
  {
    "id": "uuid",
    "mastery": 85,
    "reviewCount": 5,
    "lastReview": "2024-01-20T09:00:00Z",
    "word": {
      "id": "uuid",
      "chinese": "火",
      "pinyin": "huǒ",
      "translation": "fire",
      "example": "火车",
      "hskLevel": 1
    }
  },
  ...
]
```

---

## Database Schema

### User
```prisma
model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  password  String?
  username  String   @unique
  isGuest   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### UserProgress
```prisma
model UserProgress {
  id            String    @id @default(uuid())
  userId        String    @unique
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)
  lastStudyDate DateTime?
  hskLevel      Int       @default(1)
  totalWords    Int       @default(0)
  targetWords   Int       @default(1200)
}
```

### Word
```prisma
model Word {
  id            String   @id @default(uuid())
  chinese       String   @unique
  pinyin        String
  translation   String
  example       String?
  examplePinyin String?
  hskLevel      Int
  category      String?
}
```

### UserWord
```prisma
model UserWord {
  id          String    @id @default(uuid())
  userId      String
  wordId      String
  mastery     Int       @default(0) // 0-100
  reviewCount Int       @default(0)
  lastReview  DateTime?
  nextReview  DateTime?

  @@unique([userId, wordId])
}
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## Swagger Documentation
После запуска сервера, Swagger документация доступна по адресу:
```
http://localhost:3000/api
```

## Frontend Integration Example

```typescript
// Login
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    password: 'password123'
  })
});
const { access_token } = await response.json();

// Get today's character
const todayResponse = await fetch('http://localhost:3000/words/today', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
const todayWord = await todayResponse.json();

// Get user progress
const progressResponse = await fetch('http://localhost:3000/user/progress', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
const progress = await progressResponse.json();
```

## Notes
- JWT токены действительны 7 дней
- Streak обновляется автоматически при вызове `/user/progress/streak`
- Guest пользователи не имеют email и password
- HSK уровни: 1-6 (от начинающего до продвинутого)
- Mastery слов: 0-100 (процент усвоения)
