# План подключения базы данных (PostgreSQL + Prisma)

## Стек

- **БД**: PostgreSQL 16 (Docker)
- **ORM**: Prisma 5
- **Размещение схемы**: `apps/api/prisma/schema.prisma`
- **Prisma Client**: генерируется в `node_modules/@prisma/client`

---

## Шаг 1 — Поднять PostgreSQL через Docker

**`docker-compose.yml`** в корне монорепо:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: expense-tracker-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: expense
      POSTGRES_PASSWORD: expense
      POSTGRES_DB: expense_tracker
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U expense -d expense_tracker"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Запуск:
```bash
docker compose up -d postgres
docker compose ps   # убедиться что статус healthy
```

---

## Шаг 2 — Строка подключения

**`apps/api/.env`**:
```
DATABASE_URL="postgresql://expense:expense@localhost:5432/expense_tracker?schema=public"
```

Соответствие переменных docker-compose → .env:

| docker-compose          | .env (DATABASE_URL)    |
|-------------------------|------------------------|
| POSTGRES_USER=expense   | user: `expense`        |
| POSTGRES_PASSWORD=expense| password: `expense`  |
| POSTGRES_DB=expense_tracker | db: `expense_tracker` |
| ports: 5432:5432        | host: `localhost:5432` |

---

## Шаг 3 — Prisma Schema

**`apps/api/prisma/schema.prisma`**:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String
  name      String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  categories Category[]
  expenses   Expense[]
  @@map("users")
}

model Category {
  id        String    @id @default(cuid())
  name      String
  color     String?   @default("#6366f1")
  icon      String?
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expenses  Expense[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  @@unique([userId, name])  // нельзя две одинаковые категории у одного юзера
  @@map("categories")
}

model Expense {
  id          String   @id @default(cuid())
  amount      Decimal  @db.Decimal(12, 2)
  description String?
  date        DateTime @default(now())
  userId      String
  categoryId  String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("expenses")
}
```

### Ключевые решения схемы

| Решение | Причина |
|---------|---------|
| `@id @default(cuid())` | Безопасные непоследовательные ID |
| `amount Decimal(12,2)` | Точные финансовые вычисления, не Float |
| `onDelete: Cascade` на User→Category/Expense | Удаление юзера удаляет все его данные |
| `onDelete: Restrict` на Category→Expense | Нельзя удалить категорию с расходами |
| `@@unique([userId, name])` | Уникальность категорий в рамках пользователя |
| `@@map("users")` | Имена таблиц в snake_case вместо PascalCase |

---

## Шаг 4 — Применить миграцию

```bash
# Из корня монорепо:
npm run prisma:migrate --workspace=@expense-tracker/api -- --name init

# Что происходит внутри:
# 1. Prisma сравнивает schema.prisma с состоянием БД
# 2. Генерирует SQL-миграцию в apps/api/prisma/migrations/
# 3. Применяет миграцию к БД
# 4. Перегенерирует Prisma Client
```

Результат — создаётся файл миграции:
```
apps/api/prisma/migrations/
  └── 20260519100039_init/
      └── migration.sql   ← CREATE TABLE users, categories, expenses
```

---

## Шаг 5 — PrismaService в Nest.js

**`apps/api/src/prisma/prisma.service.ts`**:
```typescript
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit()    { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

**`apps/api/src/prisma/prisma.module.ts`**:
```typescript
@Global()   // ← делает PrismaService доступным везде без импорта модуля
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

Использование в любом сервисе:
```typescript
constructor(private readonly prisma: PrismaService) {}

// prisma автоматически типизирован по схеме:
this.prisma.expense.findMany({ where: { userId }, include: { category: true } })
this.prisma.user.create({ data: { email, password, name } })
```

---

## Полезные команды

```bash
# Создать новую миграцию после изменения схемы
npm run prisma:migrate --workspace=@expense-tracker/api -- --name add_tags

# Перегенерировать клиент без миграции
npm run prisma:generate --workspace=@expense-tracker/api

# Открыть Prisma Studio (GUI для БД)
npm run prisma:studio --workspace=@expense-tracker/api

# Остановить PostgreSQL
npm run db:down
```
