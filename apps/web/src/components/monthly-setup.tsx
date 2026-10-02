"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  Calculator,
  Copy,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  Category,
  MonthlyBudget,
} from "@/types/finance";

import {
  formatINR,
} from "@/lib/currency";

type Props = {
  month: string;
  categories: Category[];
  budgets: MonthlyBudget[];
};

type CopiedBudget = {
  categoryId: number;
  plannedAmount: string;
};

type CopyBudgetResponse = {
  message: string;
  copiedCount: number;
  budgets: CopiedBudget[];
};

export default function MonthlySetup({
  month,
  categories,
  budgets,
}: Props) {
  const router = useRouter();

  /*
   * --------------------------------------------------
   * INITIAL BUDGET VALUES
   * --------------------------------------------------
   *
   * Convert the budgets received from the backend into:
   *
   * {
   *   1: "5000.00",
   *   2: "3000.00",
   *   ...
   * }
   *
   * where the key is categoryId.
   */
  const initialBudgets =
    Object.fromEntries(
      budgets.map(
        (budget) => [
          budget.categoryId,
          budget.plannedAmount,
        ],
      ),
    );

  const [
    budgetValues,
    setBudgetValues,
  ] = useState<
    Record<number, string>
  >(initialBudgets);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  /*
   * --------------------------------------------------
   * BUDGET CATEGORIES
   * --------------------------------------------------
   *
   * Only leaf categories get budgets.
   *
   * Example:
   *
   * Subscriptions
   *   Netflix       <-- budget
   *   Prime         <-- budget
   *
   * Loans
   *   Home Loan     <-- budget
   *   Car           <-- budget
   *
   * Parent categories themselves are only
   * grouping containers.
   */
  const budgetCategories =
    categories.filter(
      (category) =>
        !category.hasChildren,
    );

  /*
   * --------------------------------------------------
   * PREVIOUS MONTH LABEL
   * --------------------------------------------------
   *
   * If selected month is:
   *
   * 2026-10
   *
   * this becomes:
   *
   * September 2026
   */
  const previousMonthLabel =
    useMemo(() => {
      const [
        yearText,
        monthText,
      ] = month.split("-");

      const year =
        Number(yearText);

      const monthNumber =
        Number(monthText);

      const date =
        new Date(
          Date.UTC(
            year,
            monthNumber - 2,
            1,
          ),
        );

      return new Intl.DateTimeFormat(
        "en-IN",
        {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        },
      ).format(date);
    }, [month]);

  /*
   * --------------------------------------------------
   * LIVE MONTHLY BUDGET TOTAL
   * --------------------------------------------------
   *
   * This changes immediately as you edit
   * individual category amounts.
   */
  const budgetTotal =
    useMemo(() => {
      return budgetCategories.reduce(
        (
          total,
          category,
        ) => {
          const raw =
            budgetValues[
              category.id
            ];

          if (
            raw === undefined ||
            raw === ""
          ) {
            return total;
          }

          const amount =
            Number(raw);

          if (
            !Number.isFinite(
              amount,
            )
          ) {
            return total;
          }

          return (
            total + amount
          );
        },
        0,
      );
    }, [
      budgetCategories,
      budgetValues,
    ]);

  /*
   * --------------------------------------------------
   * UPDATE ONE BUDGET FIELD
   * --------------------------------------------------
   */
  function updateBudget(
    categoryId: number,
    value: string,
  ) {
    setBudgetValues(
      (current) => ({
        ...current,

        [categoryId]:
          value,
      }),
    );
  }

  /*
   * --------------------------------------------------
   * READ API ERROR
   * --------------------------------------------------
   */
  async function readError(
    response: Response,
  ): Promise<string> {
    try {
      const data =
        await response.json();

      return (
        data.error ??
        "Unable to process request"
      );
    } catch {
      return (
        "Unable to process request"
      );
    }
  }

  /*
   * --------------------------------------------------
   * COPY PREVIOUS MONTH BUDGETS
   * --------------------------------------------------
   *
   * Example:
   *
   * Current selected month:
   * October 2026
   *
   * Button copies:
   * September 2026 budgets
   *
   * If October already has budgets,
   * confirmation is required because
   * they will be replaced.
   */
  async function copyPreviousMonthBudgets() {
    const shouldContinue =
      budgets.length === 0 ||
      window.confirm(
        `This will replace the current category budgets for ${month} with the budgets from ${previousMonthLabel}.\n\nContinue?`,
      );

    if (!shouldContinue) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response =
        await fetch(
          `/api/budgets/${month}/copy-previous`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            /*
             * proxyMutation() expects JSON
             * for POST requests.
             */
            body:
              JSON.stringify({}),
          },
        );

      if (
        response.status === 401
      ) {
        window.location.replace(
          "/login",
        );

        return;
      }

      if (
        response.status === 403
      ) {
        throw new Error(
          await readError(
            response,
          ),
        );
      }

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
          ),
        );
      }

      const data =
        (await response.json()) as
          CopyBudgetResponse;

      /*
       * Replace the local input values
       * immediately with the copied
       * previous-month budgets.
       */
      const copiedValues:
        Record<number, string> =
        {};

      for (
        const budget
        of data.budgets
      ) {
        copiedValues[
          budget.categoryId
        ] =
          budget.plannedAmount;
      }

      setBudgetValues(
        copiedValues,
      );

      setMessage(
        `${data.copiedCount} category budgets copied from ${previousMonthLabel}.`,
      );

      /*
       * Refresh Server Components so
       * summary totals and dashboard
       * values use the copied budgets.
       */
      router.refresh();
    } catch (error) {
      console.error(
        "Copy previous month budgets failed:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to copy previous month budgets",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * SAVE CATEGORY BUDGETS
   * --------------------------------------------------
   *
   * Incoming/available money is NOT
   * manually saved anymore.
   *
   * Backend calculates:
   *
   * Monthly Budget Total
   * +
   * eligible Carry Forward
   * =
   * Available This Month
   */
  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      const budgetRequests =
        budgetCategories
          .filter(
            (category) => {
              const value =
                budgetValues[
                  category.id
                ];

              return (
                value !==
                  undefined &&
                value !== ""
              );
            },
          )
          .map(
            (category) =>
              fetch(
                `/api/budgets/${month}/${category.id}`,
                {
                  method:
                    "PUT",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify(
                      {
                        plannedAmount:
                          budgetValues[
                            category.id
                          ],
                      },
                    ),
                },
              ),
          );

      const responses =
        await Promise.all(
          budgetRequests,
        );

      /*
       * Session expired.
       */
      if (
        responses.some(
          (response) =>
            response.status ===
            401,
        )
      ) {
        window.location.replace(
          "/login",
        );

        return;
      }

      /*
       * User is authenticated but does
       * not have Owner permission.
       */
      const forbidden =
        responses.find(
          (response) =>
            response.status ===
            403,
        );

      if (forbidden) {
        throw new Error(
          await readError(
            forbidden,
          ),
        );
      }

      /*
       * Catch any other failed request.
       */
      const failed =
        responses.find(
          (response) =>
            !response.ok,
        );

      if (failed) {
        throw new Error(
          await readError(
            failed,
          ),
        );
      }

      setMessage(
        "Category budgets saved successfully.",
      );

      /*
       * Recalculate dashboard summary,
       * charts and available amount.
       */
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save category budgets",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="rounded-2xl bg-white p-6 shadow-sm"
    >
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Monthly Budget Setup
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Set category budgets for{" "}
          {month}. Available money
          is calculated automatically.
        </p>
      </div>

      {/* LIVE TOTAL */}
      <div className="mb-7 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
            <Calculator
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">
              Total Category Budget
            </p>

            <p className="mt-1 text-2xl font-bold text-indigo-700">
              {formatINR(
                budgetTotal.toFixed(
                  2,
                ),
              )}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          This amount becomes the
          base available money for
          the selected month.
          Eligible carry-forward is
          added automatically after
          the previous calendar month
          closes.
        </p>
      </div>

      {/* CATEGORY BUDGETS */}
      <div>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              Category Budgets
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Set budgets individually
              or reuse the previous
              month&apos;s setup.
            </p>
          </div>

          {/* COPY PREVIOUS MONTH */}
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              copyPreviousMonthBudgets
            }
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy
              size={17}
              aria-hidden="true"
            />

            Copy {previousMonthLabel}
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Parent categories are used
          for grouping. Budgets are
          assigned only to individual
          expense categories.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {budgetCategories.map(
            (category) => (
              <label
                key={
                  category.id
                }
                className="block"
              >
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  {category.parent
                    ? `${category.parent.name} › ${category.name}`
                    : category.name}
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    budgetValues[
                      category.id
                    ] ?? ""
                  }
                  onChange={(
                    event,
                  ) =>
                    updateBudget(
                      category.id,
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            ),
          )}
        </div>

        {budgetCategories.length ===
          0 && (
          <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
            No budget categories are
            available yet.
          </p>
        )}
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={
            saving
          }
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Category Budgets"}
        </button>

        {message && (
          <span className="text-sm text-gray-700">
            {message}
          </span>
        )}
      </div>
    </form>
  );
}