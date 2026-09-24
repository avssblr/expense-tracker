import {
  getBudgets,
  getCategories,
  getDashboard,
  getExpenses,
  getMonthlyPlan,
  getPaymentMethods,
} from "@/lib/api";

import { formatINR } from "@/lib/currency";

import AddExpenseForm from "@/components/add-expense-form";
import TransactionList from "@/components/transaction-list";
import MonthSelector from "@/components/month-selector";
import MonthlySetup from "@/components/monthly-setup";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import LogoutButton from "@/components/logout-button";



export default async function Home(
  props: {
    searchParams?: Promise<{
      month?: string;
    }>;
  },
) {
  const token = await getSessionToken();

  if(!token){
    redirect("/login");
  }

  const searchParams =
    await props.searchParams;

  const requestedMonth =
    searchParams?.month;

  const month =
    requestedMonth &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(
      requestedMonth,
    )
      ? requestedMonth
      : "2026-09";

  const [
    dashboard,
    categories,
    paymentMethods,
    expenses,
    plan,
    budgets,
  ] = await Promise.all([
    getDashboard(month),
    getCategories(),
    getPaymentMethods(),
    getExpenses(month),
    getMonthlyPlan(month),
    getBudgets(month),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Expense Tracker
        </h1>

        <p className="mt-1 text-gray-600">
          Household monthly finances
        </p>
      </div>

      <MonthSelector month={month} />
      <LogoutButton />
    </div>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Incoming Money"
            value={formatINR(
              dashboard.summary.incoming,
            )}
          />

          <SummaryCard
            title="Spent"
            value={formatINR(
              dashboard.summary.spent,
            )}
          />

          <SummaryCard
            title="Remaining"
            value={formatINR(
              dashboard.summary.remaining,
            )}
          />
        </section>

        <section className="mt-8">
          <MonthlySetup
            month={month}
            categories={categories}
            plan={plan}
            budgets={budgets}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">
            Monthly Spending
          </h2>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-2 flex justify-between">
              <span>
                Overall utilization
              </span>

              <span className="font-semibold">
                {dashboard.summary
                  .utilizationPercent ?? 0}
                %
              </span>
            </div>

            <ProgressBar
              value={
                dashboard.summary
                  .utilizationPercent ?? 0
              }
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">
            Category Budgets
          </h2>

          <div className="space-y-4">
            {dashboard.categories.map(
              (category) => (
                <div
                  key={category.categoryId}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {category.category}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {formatINR(category.spent)}
                        {" of "}
                        {formatINR(category.budget)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">
                        {category.utilizationPercent ??
                          0}
                        %
                      </div>

                      <div className="text-sm text-gray-500">
                        {category.status}
                      </div>
                    </div>
                  </div>

                  <ProgressBar
                    value={
                      category.utilizationPercent ??
                      0
                    }
                  />

                  <p className="mt-2 text-sm text-gray-500">
                    Remaining:{" "}
                    {formatINR(
                      category.remaining,
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>
        <section className="mt-8">
          <AddExpenseForm
            key={month}
            month = {month}
            categories={categories}
            paymentMethods={paymentMethods}
          />
        </section>

        <section className="mt-8">
          <TransactionList
            expenses={expenses}
            categories={categories}
            paymentMethods={paymentMethods}
          />
      </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

function ProgressBar({
  value,
}: {
  value: number;
}) {
  const width = Math.min(
    Math.max(value, 0),
    100,
  );

  return (
    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full bg-black transition-all"
        style={{
          width: `${width}%`,
        }}
      />
    </div>
  );
}