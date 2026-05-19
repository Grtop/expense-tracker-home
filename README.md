# Expense Tracker

Монорепозиторий трекера расходов с **явным разделением на backend и frontend**.

## Архитектура

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│   FRONTEND   (apps/web)      │        │   BACKEND   (apps/api)       │
│                              │  HTTP  │                              │
│   Next.js 14 (App Router)    │ ─────► │   Nest.js 10 (REST API)      │
│   React 18 + TypeScript      │  REST  │   TypeScript + Prisma 5      │
│   Tailwind CSS + shadcn/ui   │        │   JWT + Passport             │
│   Port: 3000                 │        │   Port: 3001                 │
└──────────────────────────────┘        └──────────────┬───────────────┘
                ▲                                      │
                │                                      ▼
                │                       ┌──────────────────────────────┐
                │                       │   PostgreSQL 16 (Docker)     │
                │                       │   Port: 5432                 │
                │                       └──────────────────────────────┘
                │
                ▼
        ┌────────────────────────────────────────────┐
        │   SHARED   (packages/shared)               │
        │   Общие TypeScript-типы (DTO, enums)       │
        │   Используется и frontend, и backend       │
        └────────────────────────────────────────────┘
```

## Структура каталогов

```
expense-tracker/
├── apps/
│   ├── api/          ◄── BACKEND  — Nest.js REST API (порт 3001)
│   └── web/          ◄── FRONTEND — Next.js приложение (порт 3000)
├── packages/
│   └── shared/       ◄── Общие типы для backend и frontend
├── docker-compose.yml   PostgreSQL 16
├── package.json         npm workspaces
└── tsconfig.base.json   общие TS настройки
```

> **Соответствие имён:**
> - `apps/api` = **BACKEND** (Nest.js)
> - `apps/web` = **FRONTEND** (Next.js)
>
> Имена `api`/`web` — стандарт для монорепо. Подробности — в README внутри каждого приложения.

## Стек

### Backend (`apps/api`)
- **Nest.js 10** — модульный backend-фреймворк
- **Prisma 5** — ORM (схема в `apps/api/prisma/schema.prisma`)
- **PostgreSQL 16** — БД (поднимается через docker-compose)
- **JWT + Passport** — авторизация
- **REST API** с префиксом `/api`

### Frontend (`apps/web`)
- **Next.js 14** (App Router) + React 18
- **Tailwind CSS** + **shadcn/ui** — UI
- Запросы к backend через `NEXT_PUBLIC_API_URL`

### Shared (`packages/shared`)
- Общие TypeScript-типы, DTO, enums
- Подключается через npm workspaces (`@expense-tracker/shared`)

## Начало работы

```bash
# 1. Установить зависимости (для всех workspace'ов сразу)
npm install

# 2. Поднять PostgreSQL в Docker
npm run db:up

# 3. Скопировать env-файлы
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Применить миграции Prisma (backend)
npm run prisma:migrate --workspace=@expense-tracker/api

# 5. Запустить dev-серверы (в разных терминалах)
npm run dev:api   # BACKEND  → http://localhost:3001/api
npm run dev:web   # FRONTEND → http://localhost:3000
```

## Скрипты в корне

| Команда             | Что делает                              |
|---------------------|------------------------------------------|
| `npm run dev:api`   | Запустить **backend** в watch-режиме     |
| `npm run dev:web`   | Запустить **frontend** в dev-режиме      |
| `npm run build:api` | Собрать backend                          |
| `npm run build:web` | Собрать frontend                         |
| `npm run db:up`     | Поднять PostgreSQL (docker-compose)      |
| `npm run db:down`   | Остановить PostgreSQL                    |
# expense-tracker-home
