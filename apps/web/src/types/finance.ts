export type Category = {
  id: number;
  householdId: number;
  name: string;
  isActive: boolean;
};

export type PaymentMethod = {
  id: number;
  householdId: number;
  name: string;
  isActive: boolean;
};

export type Expense = {
  id: number;
  householdId: number;
  categoryId: number;
  createdByUserId: number;
  paymentMethodId: number | null;

  amount: string;
  expenseDate: string;
  description: string;
  notes: string | null;

  createdAt: string;
  updatedAt: string;

  category: {
    id: number;
    name: string;
  };

  createdBy: {
    id: number;
    displayName: string;
  };

  paymentMethod: {
    id: number;
    name: string;
  } | null;
};

export type MonthlyPlan = {
  id: number;
  householdId: number;
  month: string;
  plannedIncome: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MonthlyBudget = {
  id: number;
  householdId: number;
  categoryId: number;
  month: string;
  plannedAmount: string;

  category: {
    id: number;
    name: string;
  };
};