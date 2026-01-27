# Quick Start Guide - Chinese Learning App Backend

## Быстрый старт за 5 шагов

### 1. Установите PostgreSQL
Скачайте и установите PostgreSQL с официального сайта: https://www.postgresql.org/download/

Создайте базу данных:
```bash
# Войдите в PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE chinese_app;

# Выйдите
\q
```

### 2. Настройте переменные окружения
Отредактируйте файл `.env` в папке `backend`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/chinese_app?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-2024"
PORT=3000
```

Замените `YOUR_PASSWORD` на ваш пароль от PostgreSQL.

### 3. Установите зависимости и настройте базу данных
```bash
cd backend

# Установка зависимостей
npm install

# Генерация Prisma Client
npx prisma generate

# Применение миграций
npx prisma migrate dev --name init
```

### 4. Запустите сервер
```bash
npm run start:dev
```

Сервер запустится на `http://localhost:3000`

### 5. Заполните начальные данные (seed)
В новом терминале выполните:

```bash
curl -X POST http://localhost:3000/words/seed
```

Или используйте Postman/Insomnia для POST запроса на `http://localhost:3000/words/seed`

## Проверка работы API

### Тест 1: Регистрация пользователя
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

Скопируйте `access_token` из ответа.

### Тест 2: Получение иероглифа дня
```bash
curl http://localhost:3000/words/today \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Замените `YOUR_ACCESS_TOKEN` на токен из предыдущего шага.

### Тест 3: Получение профиля
```bash
curl http://localhost:3000/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Swagger UI
Откройте в браузере: http://localhost:3000/api

Здесь вы можете протестировать все API эндпоинты через удобный интерфейс.

## Prisma Studio (GUI для базы данных)
```bash
npx prisma studio
```

Откроется браузер с визуальным интерфейсом для просмотра и редактирования данных в базе.

## Troubleshooting

### Ошибка подключения к базе данных
- Убедитесь, что PostgreSQL запущен
- Проверьте правильность DATABASE_URL в .env
- Попробуйте подключиться через psql

### Prisma errors
```bash
# Пересоздать Prisma Client
npx prisma generate

# Сбросить базу данных (ВНИМАНИЕ: удалит все данные!)
npx prisma migrate reset
```

### Port already in use
Если порт 3000 занят, измените PORT в .env файле

## Готово!
Backend готов к работе. Теперь можно подключить frontend по адресу `http://localhost:3000`
