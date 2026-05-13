# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY backend/package*.json ./

# Копируем prisma
COPY backend/prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
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

# Копируем package files
COPY backend/package*.json ./

# Копируем prisma schema
COPY backend/prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

EXPOSE 3000

CMD ["node", "dist/main.js"]
