'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, type Category, type Expense } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface User { id: string; email: string; name: string | null }

export default function Dashboard({ user }: { user: User }) {
  const { logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // New expense form
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New category form
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catError, setCatError] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cats, exps] = await Promise.all([api.categories.list(), api.expenses.list()]);
      setCategories(cats);
      setExpenses(exps);
      // Автоматически выбираем первую категорию только если ещё ничего не выбрано
      if (cats.length > 0 && !categoryId) setCategoryId(cats[0]!.id);
      else if (cats.length === 0) setCategoryId('');
    } finally {
      setLoadingData(false);
    }
  }, [categoryId]);

  useEffect(() => { loadData(); }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.expenses.create({ amount: parseFloat(amount), categoryId, description: description || undefined });
      setAmount(''); setDescription('');
      const exps = await api.expenses.list();
      setExpenses(exps);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    setCatSubmitting(true);
    try {
      await api.categories.create({ name: catName, color: catColor });
      setCatName('');
      const cats = await api.categories.list();
      setCategories(cats);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await api.expenses.remove(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.categories.remove(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setExpenses(prev => prev.filter(e => e.categoryId !== id));
      if (categoryId === id) {
        const remaining = categories.filter(c => c.id !== id);
        setCategoryId(remaining[0]?.id ?? '');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось удалить категорию');
    }
  };

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Expense Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.name ?? user.email}</span>
          <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground">
            Выйти
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left — expenses */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">Итого расходов</p>
            <p className="text-3xl font-bold mt-1">
              {total.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
            </p>
          </div>

          {/* Add expense */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Добавить расход</h2>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
                    Сумма
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full mt-1 rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="text-xs font-medium text-muted-foreground">
                    Категория
                  </label>
                  <select
                    id="category"
                    required
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full mt-1 rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
                  Описание
                </label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full mt-1 rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Необязательно"
                />
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <button
                type="submit"
                disabled={submitting || categories.length === 0}
                className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Сохранение...' : 'Добавить'}
              </button>
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">Сначала создайте категорию →</p>
              )}
            </form>
          </div>

          {/* Expenses list */}
          <div className="rounded-xl border bg-card">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold">Расходы</h2>
            </div>
            {loadingData ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Загрузка...</p>
            ) : expenses.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">Расходов пока нет</p>
            ) : (
              <ul className="divide-y">
                {expenses.map(exp => (
                  <li key={exp.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: exp.category.color ?? '#6366f1' }}
                      />
                      <div>
                        <p className="text-sm font-medium">{exp.category.name}</p>
                        {exp.description && (
                          <p className="text-xs text-muted-foreground">{exp.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">
                        {parseFloat(exp.amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(exp.date).toLocaleDateString('ru-RU')}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                        aria-label="Удалить расход"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right — categories */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Категории</h2>
            <form onSubmit={handleAddCategory} className="space-y-3 mb-4">
              <div>
                <label htmlFor="categoryName" className="text-xs font-medium text-muted-foreground">
                  Название
                </label>
                <input
                  id="categoryName"
                  required
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full mt-1 rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Еда, транспорт..."
                />
              </div>
              <div>
                <label htmlFor="categoryColor" className="text-xs font-medium text-muted-foreground">
                  Цвет
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="categoryColor"
                    type="color"
                    value={catColor}
                    onChange={e => setCatColor(e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer bg-background"
                    aria-label="Выбор цвета (палитра)"
                  />
                  <input
                    type="text"
                    value={catColor}
                    onChange={e => setCatColor(e.target.value)}
                    className="flex-1 rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="HEX код цвета"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              {catError && <p className="text-sm text-destructive">{catError}</p>}
              <button
                type="submit"
                disabled={catSubmitting}
                className="w-full rounded-md bg-secondary text-secondary-foreground py-2 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
              >
                {catSubmitting ? 'Создание...' : '+ Добавить категорию'}
              </button>
            </form>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Нет категорий</p>
            ) : (
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat.id} className="flex items-center gap-2 text-sm group">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color ?? '#6366f1' }}
                    />
                    <span className="flex-1">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Удалить категорию ${cat.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}