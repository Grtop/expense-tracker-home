// Category DTOs
export interface CreateCategoryDto {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CategoryResponseDto {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Expense DTOs
export interface CreateExpenseDto {
  amount: number;
  categoryId: string;
  description?: string;
  date?: string;
}

export interface UpdateExpenseDto {
  amount?: number;
  categoryId?: string;
  description?: string;
  date?: string;
}

export interface ExpenseResponseDto {
  id: string;
  amount: string;
  description: string | null;
  date: string;
  userId: string;
  categoryId: string;
  category: CategoryResponseDto;
  createdAt: string;
  updatedAt: string;
}

// Auth DTOs
export interface AuthResponseDto {
  access_token: string;
  expires_in: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}
