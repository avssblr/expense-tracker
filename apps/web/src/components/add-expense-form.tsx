"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  Category,
  PaymentMethod,
} from "@/types/finance";

type Props = {
  month: string;
  categories: Category[];
  paymentMethods: PaymentMethod[];
};



function defaultDateForMonth(month: string) {
  const today = new Date();

  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}`;

  if (month === currentMonth) {
    const day = String(today.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  }

  return `${month}-01`;
}

export default function AddExpenseForm({
  month,
  categories,
  paymentMethods,
}: Props) {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] =
    useState("");

  const [
    paymentMethodId,
    setPaymentMethodId,
  ] = useState("");

  const [expenseDate, setExpenseDate] =
    useState(() => defaultDateForMonth(month));

  const [description, setDescription] =
    useState("");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/expenses",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            categoryId: Number(categoryId),

            paymentMethodId:
              paymentMethodId === ""
                ? null
                : Number(paymentMethodId),

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
          data.error ?? "Unable to add expense",
        );

        return;
      }

      setAmount("");
      setDescription("");
      setNotes("");

      setMessage("Expense added successfully.");

      // Causes the Server Component dashboard
      // and transaction history to fetch fresh data.
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage("Unable to reach the server.");
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
          Add Expense
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Record a new household expense.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Amount
          </span>

          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Date
          </span>

          <input
            type="date"
            required
            value={expenseDate}
            onChange={(event) =>
              setExpenseDate(event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Category
          </span>

          <select
            required
            value={categoryId}
            onChange={(event) =>
              setCategoryId(event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            <option value="">
              Select category
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Payment Method
          </span>

          <select
            value={paymentMethodId}
            onChange={(event) =>
              setPaymentMethodId(
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            <option value="">
              Select payment method
            </option>

            {paymentMethods.map((method) => (
              <option
                key={method.id}
                value={method.id}
              >
                {method.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </span>

        <input
          type="text"
          required
          maxLength={200}
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="e.g. Weekly groceries"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Notes
        </span>

        <textarea
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          maxLength={1000}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </label>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {saving
            ? "Adding..."
            : "Add Expense"}
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