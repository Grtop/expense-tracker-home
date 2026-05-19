# Project Architecture

## Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                         БРАУЗЕР                                 │
│                                                                 │
│   Next.js (apps/web) :3000                                      │
│   ┌─────────────────────────────┐                               │
│   │  localStorage               │                               │
│   │  access_token = "eyJ..."    │                               │
│   └─────────────────────────────┘                               │
│              │                                                  │
│   src/lib/api.ts                                                │
│   fetch(NEXT_PUBLIC_API_URL + path, {                           │
│     Authorization: "Bearer eyJ..."                              │
│   })                                                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP REST
                       │ http://localhost:3001/api
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│   Nest.js (apps/api) :3001                                      │
│                                                                 │
│   main.ts                                                       │
│   ├── app.setGlobalPrefix('api')                                │
│   ├── ValidationPipe (class-validator)                          │
│   └── CORS enabled                                              │
│                                                                 │
│   JwtAuthGuard → JwtStrategy → PrismaService.user.findUnique   │
│                                                                 │
│   PrismaService (extends PrismaClient)                          │
│   └── DATABASE_URL = postgresql://...@localhost:5432            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ TCP :5432
                       │ Prisma Client (автогенерация)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│   PostgreSQL 16 (Docker) :5432                                  │
│   DB: expense_tracker                                           │
│   tables: users, categories, expenses                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend → Backend: HTTP-клиент

**`apps/web/src/lib/api.ts`** — единственная точка обращения к API:

```
Запрос                         Ответ
──────────────────────────     ──────────────────────
fetch(API_URL + "/expenses")
  headers:
    Content-Type: application/json
    Authorization: Bearer <токен из localStorage>
                               200 { id, amount, category, ... }
                               401 { message: "Unauthorized" }
```

Токен кладётся в `localStorage.access_token` при логине/регистрации и читается при каждом запросе через `getToken()`.

---

## 2. Авторизация — полный цикл

```
REGISTER / LOGIN
─────────────────────────────────────────────────────────

Frontend                    Backend                      DB
────────                    ───────                      ──
POST /api/auth/register
{ email, password, name }
                            AuthController.register()
                            └── AuthService.register()
                                ├── prisma.user.findUnique  ──► users (проверка дубля)
                                ├── bcrypt.hash(password)
                                └── prisma.user.create  ──────► users (INSERT)
                                    └── jwtService.sign({ sub: id, email })
                            ◄── { access_token: "eyJ..." }

localStorage.setItem("access_token", token)
api.auth.me()  ──────────►  GET /api/users/me
                            └── JwtAuthGuard
                                └── JwtStrategy.validate()
                                    └── prisma.user.findUnique ──► users
                            ◄── { id, email, name }
setUser(me) → render Dashboard
```

---

## 3. Защита маршрутов — Guard-цепочка

```
Входящий запрос
      │
      ▼
JwtAuthGuard (passport-jwt)
      │
      ├── Извлекает токен из заголовка Authorization: Bearer <token>
      │
      ├── Верифицирует подпись с JWT_SECRET из .env
      │
      └── JwtStrategy.validate({ sub, email })
                │
                └── prisma.user.findUnique({ where: { id: sub } })
                          │
                          ├── Найден  → request.user = user → контроллер
                          └── Не найден → 401 Unauthorized
```

В контроллерах `@CurrentUser()` извлекает `request.user` (объект из БД):

```typescript
@Get()
findAll(@CurrentUser() user: User) {
  return this.expensesService.findAll(user.id); // всегда только свои данные
}
```

---

## 4. Backend → Database: Prisma

**Схема связей** (`apps/api/prisma/schema.prisma`):

```
users
─────────────────────────────
id        String  (cuid)  PK
email     String  UNIQUE
password  String  (bcrypt hash)
name      String?
createdAt DateTime
updatedAt DateTime
       │
       │ 1:N (onDelete: Cascade)
       ▼
categories
─────────────────────────────
id        String  (cuid)  PK
name      String
color     String?  (#hex)
icon      String?
userId    String   FK ──► users.id
       │
       │ UNIQUE(userId, name) — нельзя две одинаковые категории
       │
       │ 1:N (onDelete: Restrict)
       ▼                         ← нельзя удалить категорию если есть расходы
expenses
─────────────────────────────
id          String   (cuid)  PK
amount      Decimal  (12,2)
description String?
date        DateTime
userId      String   FK ──► users.id  (onDelete: Cascade)
categoryId  String   FK ──► categories.id  (onDelete: Restrict)
```

**`PrismaService`** (`apps/api/src/prisma/`) — глобальный singleton:

```typescript
// extends PrismaClient → прямой доступ к this.prisma.user / .category / .expense
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  onModuleInit()    { this.$connect() }
  onModuleDestroy() { this.$disconnect() }
}

// @Global() — не нужно импортировать PrismaModule в каждый модуль
@Global() @Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

---

## 5. Пример полного цикла: добавить расход

```
Frontend                    Backend                          DB
────────                    ───────                          ──

POST /api/expenses
Authorization: Bearer eyJ...
{ amount: 500,
  categoryId: "clx...",
  description: "Кофе" }
                            ExpensesController.create()
                            │  @UseGuards(JwtAuthGuard)
                            │  @CurrentUser() user
                            │
                            └── ExpensesService.create(user.id, dto)
                                └── prisma.expense.create({
                                      data: {
                                        amount: 500,
                                        categoryId: "clx...",
                                        description: "Кофе",
                                        userId: user.id    ← из токена!
                                      },
                                      include: { category: true }
                                    })
                                                             ──► INSERT INTO expenses
                                                             ◄── { id, amount, category{} }
◄── 201 { id: "clx...",
          amount: "500.00",
          category: { name: "Еда", color: "#6366f1" },
          ... }

setExpenses(prev => [...prev, newExpense])
```

---

## 6. Переменные окружения — мост между слоями

```
docker-compose.yml                apps/api/.env
──────────────────                ─────────────────────────────────────────────
POSTGRES_USER=expense    ──────►  DATABASE_URL=
POSTGRES_PASSWORD=expense         postgresql://expense:expense@localhost:5432/
POSTGRES_DB=expense_tracker       expense_tracker?schema=public

                                  JWT_SECRET=change-me-in-production
                                  JWT_EXPIRES_IN=7d
                                  PORT=3001

apps/web/.env
─────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001/api
      │
      └── src/lib/api.ts: const API_URL = process.env.NEXT_PUBLIC_API_URL
```
