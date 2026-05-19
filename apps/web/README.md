# Frontend — `apps/web`

**Это frontend-приложение** проекта Expense Tracker.

## Назначение

Веб-интерфейс на **Next.js 14** (App Router), который:
- предоставляет UI для управления расходами
- общается с backend (`apps/api`) через REST API
- использует **Tailwind CSS** и компоненты **shadcn/ui**

## Стек

| Слой        | Технология                  |
|-------------|-----------------------------|
| Framework   | Next.js 14 (App Router)     |
| UI Library  | React 18                    |
| Язык        | TypeScript                  |
| Стили       | Tailwind CSS                |
| Компоненты  | shadcn/ui                   |
| Иконки      | lucide-react                |

## Структура

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx        ← корневой layout
│   │   ├── page.tsx          ← главная страница
│   │   └── globals.css       ← Tailwind + CSS-переменные shadcn
│   ├── components/
│   │   └── ui/               ← shadcn/ui компоненты (button, input и т.д.)
│   └── lib/
│       └── utils.ts          ← cn() helper для Tailwind
├── public/
├── .env.example
├── components.json           ← конфиг shadcn/ui
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── package.json
└── tsconfig.json
```

## Запуск

```bash
# Из корня монорепо:
npm run dev:web

# Или из этой папки:
npm run dev
```

Приложение будет доступно на `http://localhost:3000`.

## Переменные окружения

См. `.env.example`:
- `NEXT_PUBLIC_API_URL` — URL backend-API (по умолчанию `http://localhost:3001/api`)

## Добавление shadcn-компонентов

```bash
# Из папки apps/web:
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
```
