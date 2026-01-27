# Database Setup Guide

## Ваша текущая конфигурация

```
Host: localhost
Port: 5433
Database: chinese_app
User: postgres
Password: user
```

## Вариант 1: Автоматическая установка (Рекомендуется)

В PowerShell выполните:

```powershell
cd backend
.\setup.ps1
```

Этот скрипт автоматически:
- Очистит и переустановит зависимости
- Проверит подключение к БД
- Создаст базу данных (если не существует)
- Сгенерирует Prisma Client
- Применит миграции

## Вариант 2: Ручная настройка

### Шаг 1: Проверьте, запущен ли PostgreSQL на порту 5433

```powershell
psql -U postgres -p 5433 -h localhost
```

Введите пароль: `user`

Если не подключается, убедитесь что:
1. PostgreSQL установлен и запущен
2. Порт 5433 правильный (может быть 5432 по умолчанию)
3. Пароль пользователя postgres - `user`

### Шаг 2: Создайте базу данных

В psql выполните:

```sql
CREATE DATABASE chinese_app;
\q
```

Или из командной строки:

```powershell
$env:PGPASSWORD="user"
psql -U postgres -p 5433 -h localhost -c "CREATE DATABASE chinese_app;"
```

### Шаг 3: Проверьте подключение

```powershell
$env:PGPASSWORD="user"
psql -U postgres -p 5433 -h localhost -d chinese_app -c "SELECT current_database();"
```

Должно вывести: `chinese_app`

### Шаг 4: Установите зависимости

```powershell
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install --legacy-peer-deps
```

### Шаг 5: Сгенерируйте Prisma Client

```powershell
npx prisma@5.22.0 generate
```

### Шаг 6: Примените миграции

```powershell
npx prisma@5.22.0 migrate dev --name init
```

Эта команда создаст все таблицы в вашей базе данных.

### Шаг 7: Запустите сервер

```powershell
npm run start:dev
```

## Проверка установки

После успешного запуска сервера:

### 1. Проверьте таблицы в базе данных

```powershell
$env:PGPASSWORD="user"
psql -U postgres -p 5433 -h localhost -d chinese_app -c "\dt"
```

Должны быть таблицы:
- users
- user_progress
- words
- user_words
- daily_words
- _prisma_migrations

### 2. Заполните начальные данные

```powershell
Invoke-WebRequest -Uri http://localhost:3000/words/seed -Method POST
```

### 3. Откройте Swagger UI

В браузере: http://localhost:3000/api

### 4. Откройте Prisma Studio (опционально)

```powershell
npx prisma studio
```

## Troubleshooting

### Ошибка: "database does not exist"

Создайте базу данных вручную:
```powershell
$env:PGPASSWORD="user"
psql -U postgres -p 5433 -h localhost -c "CREATE DATABASE chinese_app;"
```

### Ошибка: "password authentication failed"

Убедитесь что пароль в `.env` файле совпадает с паролем PostgreSQL:
```
DATABASE_URL="postgresql://postgres:ВАШ_РЕАЛЬНЫЙ_ПАРОЛЬ@localhost:5433/chinese_app?schema=public"
```

### Ошибка: "connect ECONNREFUSED"

1. Проверьте что PostgreSQL запущен
2. Проверьте правильность порта (может быть 5432 вместо 5433)
3. Проверьте что PostgreSQL слушает на localhost

Узнать порт PostgreSQL:
```powershell
Get-Service -Name *postg* | Select-Object Name, Status
netstat -ano | findstr :5433
netstat -ano | findstr :5432
```

### Ошибка при генерации Prisma Client

Убедитесь что используете версию 5.22.0:
```powershell
npx prisma@5.22.0 generate
```

А не глобальную версию 7.x

## Изменение порта

Если ваш PostgreSQL работает на другом порту (например, 5432), измените `.env`:

```env
DATABASE_URL="postgresql://postgres:user@localhost:5432/chinese_app?schema=public"
```

Затем повторите шаги 5-7.
