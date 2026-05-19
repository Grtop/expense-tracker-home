# План создания Frontend (apps/web)

## Стек

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **Стили**: Tailwind CSS + shadcn/ui
- **Auth**: JWT в localStorage, React Context
- **API-клиент**: нативный `fetch`

---

## Структура

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← корневой layout, AuthProvider
│   │   ├── page.tsx                ← / → редирект на /login или Dashboard
│   │   ├── dashboard.tsx           ← основной UI (Client Component)
│   │   ├── globals.css             ← @tailwind + CSS-переменные shadcn
│   │   └── (auth)/
│   │       ├── layout.tsx          ← центрированный layout для auth-страниц
│   │       ├── login/page.tsx      ← форма входа
│   │       └── register/page.tsx   ← форма регистрации
│   ├── hooks/
│   │   └── use-auth.tsx            ← AuthContext: user, login, register, logout
│   ├── components/
│   │   └── ui/                     ← shadcn/ui компоненты
│   └── lib/
│       ├── api.ts                  ← fetch-клиент
│       └── utils.ts                ← cn() helper
├── .env.example
├── components.json                 ← конфиг shadcn/ui
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Шаги реализации

### Шаг 1 — Конфигурация

**`next.config.mjs`**:
```js
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@expense-tracker/shared'],
};
```

**`tsconfig.json`** — ключевые параметры:
- `moduleResolution: Bundler` (для Next.js)
- `paths: { "@/*": ["./src/*"] }` — алиас для импортов

**`tailwind.config.ts`** — настройка для shadcn/ui:
- CSS-переменные через `hsl(var(--primary))` и т.д.
- `content` включает `src/app/**` и `src/components/**`

**`components.json`** (shadcn/ui):
```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": { "baseColor": "slate", "cssVariables": true }
}
```

**.env.example**:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

### Шаг 2 — API клиент (src/lib/api.ts)

Единственная точка HTTP-запросов. Принципы:
- Читает токен из `localStorage.access_token`
- Подставляет `Authorization: Bearer <token>` автоматически
- `204 No Content` → возвращает `undefined`
- При `!res.ok` → бросает `Error` с сообщением из тела ответа

```typescript
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error((await res.json()).message);
  if (res.status === 204) return undefined as T;
  return res.json();
}
```

Экспортирует объект `api` с методами:
- `api.auth.register / login / me`
- `api.categories.list / create / update / remove`
- `api.expenses.list / create / update / remove`

---

### Шаг 3 — AuthContext (src/hooks/use-auth.tsx)

`'use client'` — React Context с состоянием авторизации.

**Инициализация** (useEffect при монтировании):
1. Читает токен из localStorage
2. Если есть → `api.auth.me()` → `setUser(me)`
3. Если нет или ошибка → `setUser(null)`

**login(email, password)**:
1. `api.auth.login` → получает `access_token`
2. `localStorage.setItem('access_token', token)`
3. `api.auth.me()` → `setUser(me)`
4. `router.push('/')`

**logout()**:
1. `localStorage.removeItem('access_token')`
2. `setUser(null)`
3. `router.push('/login')`

**Подключение** — в корневом `layout.tsx`:
```tsx
<AuthProvider>{children}</AuthProvider>
```

---

### Шаг 4 — Роутинг и защита маршрутов

**`app/page.tsx`** (корень `/`):
```tsx
const { user, loading } = useAuth();
useEffect(() => {
  if (!loading && !user) router.push('/login');
}, [user, loading]);
if (!user) return null;
return <Dashboard user={user} />;
```

**`app/(auth)/`** — Route Group для страниц без авторизации:
- `layout.tsx` — центрированный layout (`min-h-screen flex items-center justify-center`)
- `login/page.tsx` — форма с полями email/password
- `register/page.tsx` — форма с полями name/email/password

---

### Шаг 5 — Dashboard (src/app/dashboard.tsx)

Весь UI в одном `'use client'` компоненте. Два раздела:

**Левая колонка (расходы)**:
- Карточка итоговой суммы (считается локально из `expenses`)
- Форма добавления расхода: сумма, категория (select), описание
- Список расходов: цветной кружок категории, название, сумма, дата, кнопка удаления ✕

**Правая колонка (категории)**:
- Форма создания: название + color picker (input type=color + text)
- Список категорий: кружок цвета, название, кнопка удаления ✕ (при наведении)

**Управление состоянием** — только `useState`, без внешних библиотек:
- `categories`, `expenses` — данные из API
- Отдельные стейты для каждой формы
- Оптимистичные удаления (`setExpenses(prev => prev.filter(...))`)

---

## Зависимости (package.json)

```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.344.0",
    "tailwindcss-animate": "^1.0.7",
    "@expense-tracker/shared": "*"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "typescript": "^5.3.3"
  }
}
```
