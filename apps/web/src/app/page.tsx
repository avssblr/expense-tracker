import { redirect } from "next/navigation";

import { getSessionToken } from "@/lib/session";

import {
  getBudgets,
  getCategories,
  getCategoryTree,
  getCurrentUser,
  getDashboard,
  getExpenses,
  getPaymentMethods,
} from "@/lib/api";

import MonthSelector from "@/components/month-selector";
import LogoutButton from "@/components/logout-button";
import FinanceSummary from "@/components/finance-summary";
import FinanceCharts from "@/components/finance-charts";
import BudgetOverview from "@/components/budget-overview";
import MonthlySetup from "@/components/monthly-setup";
import AddExpenseForm from "@/components/add-expense-form";
import TransactionList from "@/components/transaction-list";
import CategoryManager from "@/components/category-manager";

type PageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

export default async function Home({
  searchParams,
}: PageProps) {
  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  const params = await searchParams;

  const requestedMonth = params?.month;

  const now = new Date();

  const currentMonth =
    `${now.getFullYear()}-` +
    String(now.getMonth() + 1).padStart(2, "0");

  const month =
    requestedMonth &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)
      ? requestedMonth
      : currentMonth;

  const [
    identity,
    dashboard,
    categories,
    categoryTree,
    paymentMethods,
    expenses,
    budgets,
  ] = await Promise.all([
    getCurrentUser(),
    getDashboard(month),
    getCategories(),
    getCategoryTree(),
    getPaymentMethods(),
    getExpenses(month),
    getBudgets(month),
  ]);

  const isOwner = identity.household.role === "owner";

  const formattedMonth = new Intl.DateTimeFormat(
    "en-IN",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(new Date(`${month}-01T00:00:00.000Z`));

  return (
    <main className="min-h-screen bg-[#F0F5FF] px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Household Expense Tracker
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Welcome, {identity.user.displayName}!
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-500">
                  {identity.household.name}
                </p>

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {isOwner ? "Owner" : "Member"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MonthSelector month={month} />
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Monthly summary */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            {formattedMonth} Overview
          </h2>

          <FinanceSummary dashboard={dashboard} />
        </section>

        {/* Financial charts */}
        <FinanceCharts
          key={`charts-${month}`}
          dashboard={dashboard}
        />

        {/* Category budgets and alerts */}
        <BudgetOverview
          key={`budget-overview-${month}`}
          categories={dashboard.categories}
        />

        {/* Income and budget configuration: owner only */}
        {isOwner && (
          <MonthlySetup
            key={`monthly-setup-${month}`}
            month={month}
            categories={categories}
            budgets={budgets}
          />
        )}

        {isOwner && (
          <CategoryManager
            categories={categoryTree}
          />
        )}

        {/* Both users can add an expense */}
        <AddExpenseForm
          key={`add-expense-${month}`}
          month={month}
          categories={categories}
          paymentMethods={paymentMethods}
        />

        {/* Both users can view transactions;
            only the owner receives editing controls */}
        <TransactionList
          key={`transactions-${month}`}
          expenses={expenses}
          categories={categories}
          paymentMethods={paymentMethods}
          canManage={isOwner}
        />

        <footer className="py-4 text-center text-xs text-gray-500">
          Household Expense Tracker
        </footer>
      </div>
    </main>
  );
}