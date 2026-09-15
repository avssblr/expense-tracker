import type { Dashboard } from "@/types/dashboard";
import type {
  Category,
  Expense,
  MonthlyBudget,
  MonthlyPlan,
  PaymentMethod,
} from "@/types/finance";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:4000";

const headers = {
    "x-household-id": "1",
    "x-user-id": "1",
};

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${path}`,
    );
  }

  return response.json();
}

async function apiGetNullable<T>(
  path: string,
): Promise<T | null> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers,
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${path}`,
    );
  }

  return response.json();
}

export function getDashboard(
    month: string,
): Promise<Dashboard>{
    return apiGet(`/api/dashboard/${month}`);
}

export function getCategories(): Promise<Category[]>{
    return apiGet("/api/categories");
}

export function getPaymentMethods():
  Promise<PaymentMethod[]> {
  return apiGet("/api/payment-methods");
}

export function getExpenses(
  month: string,
): Promise<Expense[]> {
  return apiGet(`/api/expenses?month=${month}`);
}

export function getMonthlyPlan(
  month: string,
): Promise<MonthlyPlan | null> {
  return apiGetNullable(
    `/api/monthly-plans/${month}`,
  );
}

export function getBudgets(
  month: string,
): Promise<MonthlyBudget[]> {
  return apiGet(`/api/budgets/${month}`);
}