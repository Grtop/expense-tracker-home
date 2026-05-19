# Shared — `packages/shared`

Общий пакет с **TypeScript-типами**, используемыми и **frontend** (`apps/web`), и **backend** (`apps/api`).

## Что сюда класть

- DTO для запросов/ответов API
- Общие enum'ы (например, `ExpenseStatus`, `Currency`)
- Утилитарные типы, независимые от среды (без React/Nest зависимостей)

## Что НЕ класть

- React-компоненты → `apps/web`
- Nest-сервисы/декораторы → `apps/api`
- Prisma-типы (генерируются Prisma внутри `apps/api`)

## Подключение

В `apps/api/package.json` и `apps/web/package.json` уже прописано:

```json
"dependencies": {
  "@expense-tracker/shared": "*"
}
```

Импорт:

```ts
import type { CreateExpenseDto } from '@expense-tracker/shared';
```
