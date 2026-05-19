const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      request<{ access_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<{ id: string; email: string; name: string | null }>('/users/me'),
  },
  categories: {
    list: () => request<Category[]>('/categories'),
    create: (data: { name: string; color?: string }) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; color?: string }) =>
      request<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  expenses: {
    list: () => request<Expense[]>('/expenses'),
    create: (data: { amount: number; categoryId: string; description?: string; date?: string }) =>
      request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ amount: number; categoryId: string; description: string; date: string }>) =>
      request<Expense>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),
  },
};

export interface Category {
  id: string;
  name: string;
  color: string | null;
  userId: string;
}

export interface Expense {
  id: string;
  amount: string;
  description: string | null;
  date: string;
  categoryId: string;
  category: Category;
  userId: string;
}
