# Chinese Learning App - Backend API

NestJS REST API for the Chinese learning application with AI tutor integration.

## Setup

```bash
npm install
```

## Environment Variables

Create `.env` file:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chinese_app
JWT_SECRET=supersecretkey
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=sk-... (optional)
```

## Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Database

```bash
# Run migrations
npx prisma migrate dev

# Seed data (1051 HSK words)
npm run seed
```

## API Endpoints

- **Auth**: POST /auth/signup, POST /auth/login, POST /auth/guest
- **Tutor**: POST /tutor/chat, GET /tutor/history, POST /tutor/emotion/:emotion
- **Words**: GET /words, GET /words/:id
- **Users**: GET /users/profile, PATCH /users/profile
- **Goals**: GET /goals, POST /goals, PATCH /goals/:id
- **SRS**: GET /srs, POST /srs/review

## License

MIT
