# Backend — `apps/api`

**Это backend-приложение** проекта Expense Tracker.

## Назначение

REST API на **Nest.js**, который:
- обслуживает запросы от frontend (`apps/web`)
- работает с базой PostgreSQL через **Prisma ORM**
- отвечает за авторизацию (JWT + Passport)
- содержит бизнес-логику: пользователи, категории, расходы

## Стек

| Слой       | Технология                  |
|------------|-----------------------------|
| Framework  | Nest.js 10                  |
| Язык       | TypeScript                  |
| ORM        | Prisma 5                    |
| БД         | PostgreSQL 16               |
| Auth       | JWT + Passport              |
| Валидация  | class-validator             |
| Документация| Swagger (`@nestjs/swagger`)|

## Структура

```
apps/api/
├── prisma/
│   └── schema.prisma     ← схема БД (модели появятся на следующем шаге)
├── src/
│   ├── main.ts           ← bootstrap (CORS, ValidationPipe, префикс /api)
│   ├── app.module.ts     ← корневой модуль
│   ├── prisma/           ← глобальный PrismaModule + PrismaService
│   ├── auth/             ← авторизация (JWT, регистрация, логин)
│   ├── users/            ← пользователи
│   ├── categories/       ← категории расходов
│   └── expenses/         ← расходы
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

## Запуск

```bash
# Из корня монорепо:
npm run dev:api

# Или из этой папки:
npm run start:dev
```

API будет доступен на `http://localhost:3001/api`.

## Переменные окружения

См. `.env.example`:
- `DATABASE_URL` — строка подключения к PostgreSQL
- `JWT_SECRET` — секрет для подписи JWT
- `JWT_EXPIRES_IN` — срок жизни токена
- `PORT` — порт backend-сервера (по умолчанию 3001)
