import { formatINR } from "@/lib/currency";
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
}: {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  return (
    <section className="rounded-xl bg-white shadow-sm">
      <div className="border-b p-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Recent Transactions
        </h2>
      </div>

      {expenses.length === 0 ? (
        <p className="p-6 text-gray-500">
          No expenses recorded this month.
        </p>
      ) : (
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
                <th className="px-6 py-3 text-right">
                 Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b last:border-0"
                >
                  <td className="px-6 py-4 text-gray-700">
                    {expense.expenseDate}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {expense.description}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {expense.category.name}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {expense.paymentMethod
                      ?.name ?? "—"}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {
                      expense.createdBy
                        .displayName
                    }
                  </td>

                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    {formatINR(
                      expense.amount,
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <ExpenseActions
                    expense={expense}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    />
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}