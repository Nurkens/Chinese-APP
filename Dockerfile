# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files из backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код backend
COPY backend/src ./src
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Устанавливаем только production зависимости
COPY backend/package*.json ./
RUN npm ci --only=production

# Копируем prisma schema для миграций
COPY backend/prisma ./prisma/

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Обеспечиваем permissions для запуска
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

CMD ["node", "dist/main.js"]
