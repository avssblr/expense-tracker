"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import type {
  Category,
  MonthlyBudget,
  MonthlyPlan,
} from "@/types/finance";

type Props = {
  month: string;
  categories: Category[];
  plan: MonthlyPlan | null;
  budgets: MonthlyBudget[];
};

export default function MonthlySetup({
  month,
  categories,
  plan,
  budgets,
}: Props) {
  const router = useRouter();

  const [plannedIncome, setPlannedIncome] =
    useState(
      plan?.plannedIncome ?? "",
    );

  const initialBudgets =
    Object.fromEntries(
      budgets.map((budget) => [
        budget.categoryId,
        budget.plannedAmount,
      ]),
    );

  const [
    budgetValues,
    setBudgetValues,
  ] = useState<Record<number, string>>(
    initialBudgets,
  );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  function updateBudget(
    categoryId: number,
    value: string,
  ) {
    setBudgetValues((current) => ({
      ...current,
      [categoryId]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      const planResponse = await fetch(
        `/api/monthly-plans/${month}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            plannedIncome,
          }),
        },
      );

      if (!planResponse.ok) {
        throw new Error(
          "Unable to save monthly income",
        );
      }

      const budgetRequests =
        categories
          .filter((category) => {
            const value =
              budgetValues[category.id];

            return (
              value !== undefined &&
              value !== ""
            );
          })
          .map((category) =>
            fetch(
              `/api/budgets/${month}/${category.id}`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  plannedAmount:
                    budgetValues[
                      category.id
                    ],
                }),
              },
            ),
          );

      const responses =
        await Promise.all(
          budgetRequests,
        );

      const failed =
        responses.some(
          (response) => !response.ok,
        );

      if (failed) {
        throw new Error(
          "One or more budgets could not be saved",
        );
      }

      setMessage(
        "Monthly setup saved successfully.",
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save monthly setup",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Monthly Setup
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Set available money and
          category budgets for {month}.
        </p>
      </div>

      <label className="block max-w-sm">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Incoming Money
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={plannedIncome}
          onChange={(event) =>
            setPlannedIncome(
              event.target.value,
            )
          }
          placeholder="200000.00"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </label>

      <div className="mt-7">
        <h3 className="mb-4 font-semibold text-gray-900">
          Category Budgets
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {categories.map(
            (category) => (
              <label
                key={category.id}
                className="block"
              >
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  {category.name}
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
                  onChange={(event) =>
                    updateBudget(
                      category.id,
                      event.target.value,
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>
            ),
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Monthly Setup"}
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