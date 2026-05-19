# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Монорепозиторий трекера расходов на npm workspaces:
- `apps/api` — **backend** (Nest.js 10, REST API, порт 3001)
- `apps/web` — **frontend** (Next.js 14 App Router, порт 3000)
- `packages/shared` — общие TypeScript-интерфейсы (DTO, типы ответов)

## Commands

All commands run from the repo root unless noted.

```bash
# Dev servers
npm run dev:api       # backend → http://localhost:3001/api
npm run dev:web       # frontend → http://localhost:3000

# Database
npm run db:up         # docker compose up -d postgres
npm run db:down       # docker compose down

# Build
npm run build:api
npm run build:web

# Prisma (from repo root)
npm run prisma:generate --workspace=@expense-tracker/api
npm run prisma:migrate --workspace=@expense-tracker/api -- --name <migration_name>
npm run prisma:studio --workspace=@expense-tracker/api

# Type-check api (run from apps/api/)
npx tsc --noEmit
```

## Architecture

### Backend (`apps/api`)

Nest.js модульная структура. Каждый домен — отдельный модуль:

```
src/
  prisma/      — глобальный PrismaModule + PrismaService (extends PrismaClient)
  auth/        — JWT + Passport: register, login, JwtStrategy, JwtAuthGuard
  users/       — GET /users/me, CurrentUser decorator
  categories/  — CRUD категорий (scope per userId)
  expenses/    — CRUD расходов (scope per userId, include category)
```

- `PrismaModule` помечен `@Global()` — инжектить `PrismaService` можно в любой модуль без импорта
- Все CRUD-эндпоинты защищены `JwtAuthGuard`, userId берётся из токена через `@CurrentUser()`
- Prisma schema: `apps/api/prisma/schema.prisma` — модели `User`, `Category`, `Expense`
- Миграции: `apps/api/prisma/migrations/`
- `.env` берётся из `apps/api/.env` (см. `.env.example`)

### Frontend (`apps/web`)

Next.js 14 App Router, все страницы клиентские (`'use client'`).

```
src/
  app/
    layout.tsx        — корневой layout, оборачивает в AuthProvider
    page.tsx          — защищённый роут: редирект на /login если нет токена
    dashboard.tsx     — основной UI (расходы + категории)
    (auth)/
      login/page.tsx
      register/page.tsx
  hooks/
    use-auth.tsx      — AuthContext: user, login, register, logout
  lib/
    api.ts            — fetch-клиент, JWT из localStorage
    utils.ts          — cn() helper (clsx + tailwind-merge)
```

- Токен хранится в `localStorage` под ключом `access_token`
- `api.ts` автоматически подставляет `Authorization: Bearer <token>` в каждый запрос
- `NEXT_PUBLIC_API_URL` в `.env` задаёт адрес backend (default: `http://localhost:3001/api`)

### Shared (`packages/shared`)

Только TypeScript-интерфейсы (не Prisma-типы). Подключается в оба приложения через `@expense-tracker/shared`.

## Key conventions

- DTO-классы в `apps/api` используют `class-validator` декораторы; `strictPropertyInitialization: false` в tsconfig
- `tsconfig.json` в `apps/api` использует `module: node16` / `moduleResolution: node16`
- Все CRUD-сервисы в api возвращают данные только текущего пользователя (фильтр по `userId`)
- `onDelete: Cascade` на User → Category/Expense; `onDelete: Restrict` на Category → Expense (нельзя удалить категорию с расходами)
