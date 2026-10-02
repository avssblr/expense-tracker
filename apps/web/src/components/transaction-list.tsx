"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import {
  formatINR,
} from "@/lib/currency";

import type {
  Category,
  Expense,
  PaymentMethod,
} from "@/types/finance";

import ExpenseActions from "@/components/expense-actions";

export default function TransactionList({
  expenses,
  categories,
  paymentMethods,
  canManage,
}: {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  canManage: boolean;
}) {
  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("");

  /*
   * --------------------------------------------------
   * CATEGORY LOOKUP
   * --------------------------------------------------
   *
   * Gives us a friendly display name:
   *
   * Loans › Home Loan
   * Subscriptions › Netflix
   *
   * rather than only:
   *
   * Home Loan
   * Netflix
   */
  const categoryLabelByName =
    useMemo(() => {
      const map =
        new Map<
          string,
          string
        >();

      for (
        const category
        of categories
      ) {
        const label =
          category.parent
            ? `${category.parent.name} › ${category.name}`
            : category.name;

        map.set(
          category.name,
          label,
        );
      }

      return map;
    }, [categories]);

  /*
   * --------------------------------------------------
   * CATEGORY FILTER OPTIONS
   * --------------------------------------------------
   *
   * Only categories that:
   *
   * 1. Can actually receive expenses
   * 2. Are present in this month's
   *    transaction list
   *
   * are displayed.
   */
  const categoryOptions =
    useMemo(() => {
      const expenseCategories =
        new Set(
          expenses.map(
            (expense) =>
              expense.category.name,
          ),
        );

      return categories
        .filter(
          (category) =>
            !category.hasChildren &&
            expenseCategories.has(
              category.name,
            ),
        )
        .sort((a, b) => {
          const labelA =
            a.parent
              ? `${a.parent.name} › ${a.name}`
              : a.name;

          const labelB =
            b.parent
              ? `${b.parent.name} › ${b.name}`
              : b.name;

          return labelA.localeCompare(
            labelB,
          );
        });
    }, [
      categories,
      expenses,
    ]);

  /*
   * --------------------------------------------------
   * FILTER TRANSACTIONS
   * --------------------------------------------------
   */
  const filteredExpenses =
    useMemo(() => {
      const query =
        searchText
          .trim()
          .toLowerCase();

      return expenses.filter(
        (expense) => {
          /*
           * CATEGORY FILTER
           */
          if (
            selectedCategory &&
            expense.category.name !==
              selectedCategory
          ) {
            return false;
          }

          /*
           * No general search entered.
           *
           * Category-filter result can
           * immediately be returned.
           */
          if (!query) {
            return true;
          }

          const categoryLabel =
            categoryLabelByName.get(
              expense.category.name,
            ) ??
            expense.category.name;

          const paymentMethod =
            expense.paymentMethod
              ?.name ?? "";

          const addedBy =
            expense.createdBy
              .displayName ?? "";

          /*
           * Search across the main
           * transaction fields.
           */
          const searchableValues =
            [
              expense.description,
              expense.category.name,
              categoryLabel,
              paymentMethod,
              addedBy,
              expense.amount,
              expense.expenseDate,
              formatINR(
                expense.amount,
              ),
            ];

          return searchableValues.some(
            (value) =>
              String(value)
                .toLowerCase()
                .includes(
                  query,
                ),
          );
        },
      );
    }, [
      expenses,
      selectedCategory,
      searchText,
      categoryLabelByName,
    ]);

  const filtersActive =
    searchText.trim() !== "" ||
    selectedCategory !== "";

  /*
   * --------------------------------------------------
   * RESET
   * --------------------------------------------------
   *
   * Clearing both controls immediately
   * restores every transaction for the
   * selected month.
   */
  function resetFilters() {
    setSearchText("");
    setSelectedCategory("");
  }

  return (
    <section className="rounded-xl bg-white shadow-sm">
      {/* HEADER */}
      <div className="border-b p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Transactions
            </h2>

            {expenses.length >
              0 && (
              <p className="mt-1 text-sm text-gray-500">
                {filtersActive ? (
                  <>
                    Showing{" "}
                    {
                      filteredExpenses.length
                    }{" "}
                    of{" "}
                    {
                      expenses.length
                    }{" "}
                    transactions
                  </>
                ) : (
                  <>
                    {
                      expenses.length
                    }{" "}
                    {expenses.length ===
                    1
                      ? "transaction"
                      : "transactions"}
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {expenses.length >
          0 && (
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
            {/*
             * GENERAL SEARCH
             */}
            <div className="relative">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={
                  searchText
                }
                onChange={(
                  event,
                ) =>
                  setSearchText(
                    event.target
                      .value,
                  )
                }
                placeholder="Search description, category, payment, person, amount..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              {searchText && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchText(
                      "",
                    )
                  }
                  aria-label="Clear search"
                  title="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X
                    size={16}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            {/*
             * CATEGORY FILTER
             */}
            <select
              value={
                selectedCategory
              }
              onChange={(
                event,
              ) =>
                setSelectedCategory(
                  event.target
                    .value,
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">
                All categories
              </option>

              {categoryOptions.map(
                (category) => {
                  const label =
                    category.parent
                      ? `${category.parent.name} › ${category.name}`
                      : category.name;

                  return (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.name
                      }
                    >
                      {label}
                    </option>
                  );
                },
              )}
            </select>

            {/*
             * RESET ALL FILTERS
             */}
            <button
              type="button"
              onClick={
                resetFilters
              }
              disabled={
                !filtersActive
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw
                size={16}
                aria-hidden="true"
              />

              Reset
            </button>
          </div>
        )}
      </div>

      {/*
       * NO TRANSACTIONS FOR MONTH
       */}
      {expenses.length ===
      0 ? (
        <p className="p-6 text-gray-500">
          No expenses recorded this
          month.
        </p>
      ) : filteredExpenses.length ===
        0 ? (
        /*
         * TRANSACTIONS EXIST,
         * BUT FILTER FOUND NOTHING
         */
        <div className="p-8 text-center">
          <p className="font-medium text-gray-800">
            No matching transactions
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Try changing the search
            or category filter.
          </p>

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            <RotateCcw
              size={15}
            />

            Show all transactions
          </button>
        </div>
      ) : (
        /*
         * TRANSACTION TABLE
         */
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="px-6 py-3">
                  Date
                </th>

                <th className="px-6 py-3">
                  Description
                </th>

                <th className="px-6 py-3">
                  Category
                </th>

                <th className="px-6 py-3">
                  Payment
                </th>

                <th className="px-6 py-3">
                  Added By
                </th>

                <th className="px-6 py-3 text-right">
                  Amount
                </th>

                {canManage && (
                  <th className="px-6 py-3 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.map(
                (expense) => {
                  const categoryLabel =
                    categoryLabelByName.get(
                      expense.category
                        .name,
                    ) ??
                    expense.category
                      .name;

                  return (
                    <tr
                      key={
                        expense.id
                      }
                      className="border-b last:border-0"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                        {
                          expense.expenseDate
                        }
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {
                          expense.description
                        }
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {
                          categoryLabel
                        }
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {expense
                          .paymentMethod
                          ?.name ??
                          "—"}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {
                          expense.createdBy
                            .displayName
                        }
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-gray-900">
                        {formatINR(
                          expense.amount,
                        )}
                      </td>

                      {canManage && (
                        <td className="px-6 py-4">
                          <ExpenseActions
                            expense={
                              expense
                            }
                            categories={
                              categories
                            }
                            paymentMethods={
                              paymentMethods
                            }
                          />
                        </td>
                      )}
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}