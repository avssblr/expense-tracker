"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import type {
  Category,
  Expense,
  PaymentMethod,
} from "@/types/finance";

type Props = {
  expense: Expense;
  categories: Category[];
  paymentMethods: PaymentMethod[];
};

export default function ExpenseActions({
  expense,
  categories,
  paymentMethods,
}: Props) {
  const router = useRouter();

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [amount, setAmount] =
    useState(expense.amount);

  const [expenseDate, setExpenseDate] =
    useState(expense.expenseDate);

  const [categoryId, setCategoryId] =
    useState(String(expense.categoryId));

  const [
    paymentMethodId,
    setPaymentMethodId,
  ] = useState(
    expense.paymentMethodId
      ? String(expense.paymentMethodId)
      : "",
  );

  const [description, setDescription] =
    useState(expense.description);

  const [notes, setNotes] =
    useState(expense.notes ?? "");

  const [message, setMessage] =
    useState<string | null>(null);

  async function updateExpense(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/expenses/${expense.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            categoryId:
              Number(categoryId),

            paymentMethodId:
              paymentMethodId === ""
                ? null
                : Number(
                    paymentMethodId,
                  ),

            amount,
            expenseDate,
            description,

            notes:
              notes.trim() === ""
                ? null
                : notes.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ??
            "Unable to update expense",
        );

        return;
      }

      setEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to reach the server",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense() {
    const confirmed = window.confirm(
      `Delete "${expense.description}" for ₹${expense.amount}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/expenses/${expense.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data =
          await response.json();

        alert(
          data.error ??
            "Unable to delete expense",
        );

        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert("Unable to reach the server");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-gray-700 hover:text-black"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={deleteExpense}
          disabled={deleting}
          className="text-sm font-medium text-red-600 disabled:opacity-50"
        >
          {deleting
            ? "Deleting..."
            : "Delete"}
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={updateExpense}
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Expense
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditing(false)
                }
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm text-gray-700">
                  Amount
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2 text-gray-900"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm text-gray-700">
                  Date
                </span>

                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(event) =>
                    setExpenseDate(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2 text-gray-900"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm text-gray-700">
                  Category
                </span>

                <select
                  required
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2 text-gray-900"
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm text-gray-700">
                  Payment Method
                </span>

                <select
                  value={paymentMethodId}
                  onChange={(event) =>
                    setPaymentMethodId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2 text-gray-900"
                >
                  <option value="">
                    None
                  </option>

                  {paymentMethods.map(
                    (method) => (
                      <option
                        key={method.id}
                        value={method.id}
                      >
                        {method.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-gray-700">
                Description
              </span>

              <input
                required
                maxLength={200}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border px-3 py-2 text-gray-900"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-gray-700">
                Notes
              </span>

              <textarea
                rows={3}
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border px-3 py-2 text-gray-900"
              />
            </label>

            {message && (
              <p className="mt-3 text-sm text-red-600">
                {message}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setEditing(false)
                }
                className="rounded-lg border px-4 py-2 text-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}