# План создания Backend (apps/api)

## Стек

- **Framework**: Nest.js 10
- **Язык**: TypeScript
- **ORM**: Prisma 5
- **БД**: PostgreSQL 16
- **Auth**: JWT + Passport
- **Валидация**: class-validator + class-transformer
- **API**: REST с префиксом `/api`

---

## Структура модулей

```
apps/api/
├── prisma/
│   └── schema.prisma          ← схема БД
├── src/
│   ├── main.ts                ← bootstrap
│   ├── app.module.ts          ← корневой модуль
│   ├── prisma/
│   │   ├── prisma.module.ts   ← @Global() модуль
│   │   └── prisma.service.ts  ← extends PrismaClient
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts ← POST /auth/register, POST /auth/login
│   │   ├── auth.service.ts    ← bcrypt + jwtService.sign
│   │   ├── auth.dto.ts        ← RegisterDto, LoginDto
│   │   ├── jwt.strategy.ts    ← PassportStrategy, validate()
│   │   └── jwt-auth.guard.ts  ← AuthGuard('jwt')
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts       ← GET /users/me
│   │   └── current-user.decorator.ts ← @CurrentUser()
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts  ← CRUD /categories
│   │   ├── categories.service.ts
│   │   └── categories.dto.ts
│   └── expenses/
│       ├── expenses.module.ts
│       ├── expenses.controller.ts    ← CRUD /expenses
│       ├── expenses.service.ts
│       └── expenses.dto.ts
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## Шаги реализации

### Шаг 1 — Конфигурационные файлы

**`nest-cli.json`**:
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

**`tsconfig.json`** — ключевые параметры для Nest.js:
- `module: node16`, `moduleResolution: node16`
- `experimentalDecorators: true`, `emitDecoratorMetadata: true`
- `strictPropertyInitialization: false` — необходимо для DTO с декораторами

**.env.example**:
```
DATABASE_URL="postgresql://expense:expense@localhost:5432/expense_tracker?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
```

---

### Шаг 2 — Bootstrap (main.ts)

```typescript
const app = await NestFactory.create(AppModule);
app.enableCors({ origin: true, credentials: true });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.setGlobalPrefix('api');
await app.listen(3001);
```

---

### Шаг 3 — PrismaModule (глобальный)

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit()    { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}

// prisma.module.ts
@Global()  // ← не нужно импортировать в каждый модуль
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

---

### Шаг 4 — AuthModule

**Регистрация**:
1. Проверить `prisma.user.findUnique` — если есть → `ConflictException`
2. `bcrypt.hash(password, 10)`
3. `prisma.user.create`
4. `jwtService.sign({ sub: user.id, email })`

**Логин**:
1. `prisma.user.findUnique` — если нет → `UnauthorizedException`
2. `bcrypt.compare(password, user.password)`
3. `jwtService.sign({ sub: user.id, email })`

**JwtStrategy**:
```typescript
// Читает токен из заголовка Authorization: Bearer <token>
// Верифицирует подпись JWT_SECRET
// validate({ sub }) → prisma.user.findUnique → request.user
```

**JwtAuthGuard** — навешивается на все защищённые контроллеры через `@UseGuards(JwtAuthGuard)`.

---

### Шаг 5 — Доменные модули (Categories, Expenses)

Каждый модуль:
- **Controller**: `@UseGuards(JwtAuthGuard)` на весь класс, userId берётся из `@CurrentUser()`
- **Service**: все запросы к БД фильтруются по `userId` — пользователь видит только свои данные
- **DTO**: class-validator декораторы (`@IsString`, `@IsNumber`, `@IsOptional` и т.д.)

Пример сервиса:
```typescript
findAll(userId: string) {
  return this.prisma.expense.findMany({
    where: { userId },           // ← всегда фильтр по владельцу
    include: { category: true },
    orderBy: { date: 'desc' },
  });
}
```

---

### Шаг 6 — app.module.ts

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ExpensesModule,
  ],
})
export class AppModule {}
```

---

## API endpoints

| Метод  | Путь                   | Защита | Описание                  |
|--------|------------------------|--------|---------------------------|
| POST   | /api/auth/register     | —      | Регистрация               |
| POST   | /api/auth/login        | —      | Логин                     |
| GET    | /api/users/me          | JWT    | Профиль текущего юзера    |
| GET    | /api/categories        | JWT    | Список категорий          |
| POST   | /api/categories        | JWT    | Создать категорию         |
| PATCH  | /api/categories/:id    | JWT    | Обновить категорию        |
| DELETE | /api/categories/:id    | JWT    | Удалить категорию         |
| GET    | /api/expenses          | JWT    | Список расходов           |
| POST   | /api/expenses          | JWT    | Создать расход            |
| PATCH  | /api/expenses/:id      | JWT    | Обновить расход           |
| DELETE | /api/expenses/:id      | JWT    | Удалить расход            |

---

## Зависимости (package.json)

```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.0",
    "@prisma/client": "^5.10.0",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "prisma": "^5.10.0",
    "typescript": "^5.3.3"
  }
}
```
