import {
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  formatINR,
} from "@/lib/currency";

import type {
  Dashboard,
} from "@/types/dashboard";

/*
 * Loans and Subscriptions contain
 * fixed / expected monthly payments.
 *
 * Dashboard category labels for
 * subcategories are in this format:
 *
 * Loans › Home Loan
 * Loans › Car
 * Subscriptions › Netflix
 *
 * These categories:
 *
 * - Always show a full green bar
 * - Never generate warning icons
 * - Never count towards budget alerts
 */
function isFixedExpectedCategory(
  categoryName: string,
): boolean {
  const rootCategory =
    categoryName
      .split("›")[0]
      .trim()
      .toLowerCase();

  return (
    rootCategory === "loans" ||
    rootCategory ===
      "subscriptions"
  );
}

export default function BudgetOverview({
  categories,
}: {
  categories:
    Dashboard["categories"];
}) {
  /*
   * Loans and Subscriptions are
   * intentionally excluded from
   * budget warnings.
   */
  const alerts =
    categories.filter(
      (category) =>
        !isFixedExpectedCategory(
          category.category,
        ) &&
        category.status !== "OK",
    );

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">
          Category Budgets
        </h2>

        {alerts.length > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {alerts.length}{" "}
            {alerts.length === 1
              ? "budget alert"
              : "budget alerts"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
            <CheckCircle2
              size={16}
            />
            No category warnings
          </span>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500">
          No category budgets
          configured for this month.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {categories.map(
            (category) => {
              const used =
                category
                  .utilizationPercent ??
                0;

              const fixedExpected =
                isFixedExpectedCategory(
                  category.category,
                );

              /*
               * Normal categories:
               *
               * Progress width follows
               * actual utilization,
               * capped visually at 100%.
               *
               * Loans / Subscriptions:
               *
               * Always visually show a
               * complete green bar because
               * these are fixed expected
               * commitments.
               */
              const width =
                fixedExpected
                  ? 100
                  : Math.min(
                      Math.max(
                        used,
                        0,
                      ),
                      100,
                    );

              /*
               * Fixed expected categories
               * never display warnings.
               */
              const warning =
                !fixedExpected &&
                category.status !==
                  "OK";

              /*
               * COLOUR RULES
               *
               * Loans / Subscriptions
               * ---------------------
               * Always green.
               *
               * Other categories
               * ----------------
               * Keep existing colours.
               *
               * Red is used ONLY when
               * utilization is > 100%.
               *
               * At exactly 100%, the
               * category remains orange.
               */
              let barColor =
                "bg-indigo-500";

              if (fixedExpected) {
                barColor =
                  "bg-emerald-500";
              } else if (
                used > 100
              ) {
                barColor =
                  "bg-red-500";
              } else if (
                category.status ===
                  "CRITICAL" ||
                category.status ===
                  "EXCEEDED"
              ) {
                /*
                 * EXCEEDED may currently
                 * be returned by the
                 * backend at exactly 100%.
                 *
                 * Since red should appear
                 * only AFTER 100%, use
                 * orange here.
                 */
                barColor =
                  "bg-orange-500";
              } else if (
                category.status ===
                "WARNING"
              ) {
                barColor =
                  "bg-amber-400";
              }

              return (
                <div
                  key={
                    category.categoryId
                  }
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {
                        category.category
                      }
                    </h3>

                    {warning && (
                      <AlertTriangle
                        size={18}
                        className="text-amber-600"
                        aria-label={
                          category.status
                        }
                      />
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {formatINR(
                      category.spent,
                    )}
                    {" of "}
                    {formatINR(
                      category.budget,
                    )}
                  </p>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{
                        width:
                          `${width}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between gap-2 text-xs text-gray-600">
                    <span>
                      {used}% used
                    </span>

                    <span>
                      {formatINR(
                        category.remaining,
                      )}{" "}
                      left
                    </span>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}