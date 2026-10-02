import {
  ArrowRightLeft,
  CreditCard,
  PiggyBank,
  Wallet,
  WalletCards,
} from "lucide-react";

import {
  formatINR,
} from "@/lib/currency";

import type {
  Dashboard,
} from "@/types/dashboard";

export default function FinanceSummary({
  dashboard,
}: {
  dashboard: Dashboard;
}) {
  const cards = [
    {
      label:
        "Monthly Budget",

      value:
        dashboard.summary
          .budgetTotal,

      Icon:
        WalletCards,

      background:
        "bg-indigo-100",

      text:
        "text-indigo-900",

      icon:
        "text-indigo-600",
    },

    {
      label:
        "Carry Forward",

      value:
        dashboard.summary
          .carryForward,

      Icon:
        ArrowRightLeft,

      background:
        "bg-violet-100",

      text:
        "text-violet-900",

      icon:
        "text-violet-600",
    },

    {
      label:
        "Available This Month",

      value:
        dashboard.summary
          .incoming,

      Icon:
        Wallet,

      background:
        "bg-blue-100",

      text:
        "text-blue-900",

      icon:
        "text-blue-600",
    },

    {
      label:
        "Total Expenses",

      value:
        dashboard.summary
          .spent,

      Icon:
        CreditCard,

      background:
        "bg-pink-100",

      text:
        "text-pink-900",

      icon:
        "text-pink-600",
    },

    {
      label:
        "Remaining",

      value:
        dashboard.summary
          .remaining,

      Icon:
        PiggyBank,

      background:
        dashboard.summary
          .status ===
        "OVERSPENT"
          ? "bg-red-100"
          : "bg-emerald-100",

      text:
        dashboard.summary
          .status ===
        "OVERSPENT"
          ? "text-red-900"
          : "text-emerald-900",

      icon:
        dashboard.summary
          .status ===
        "OVERSPENT"
          ? "text-red-600"
          : "text-emerald-600",
    },
  ];

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(
          (card) => (
            <div
              key={
                card.label
              }
              className={`${card.background} rounded-2xl p-5 shadow-sm`}
            >
              <card.Icon
                size={24}
                className={
                  card.icon
                }
                aria-hidden="true"
              />

              <p
                className={`mt-4 text-sm font-medium ${card.text}`}
              >
                {card.label}
              </p>

              <p
                className={`mt-2 break-words text-2xl font-bold ${card.text}`}
              >
                {formatINR(
                  card.value,
                )}
              </p>
            </div>
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        {dashboard.summary
          .carryForwardApplied &&
        dashboard.summary
          .carryForwardSourceMonth ? (
          <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">
            Carry-forward from{" "}
            {
              dashboard.summary
                .carryForwardSourceMonth
            }
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1">
            No finalized carry-forward
          </span>
        )}

        <span
          className={`rounded-full px-3 py-1 ${
            dashboard.summary
              .isClosed
              ? "bg-slate-100 text-slate-600"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {dashboard.summary
            .isClosed
            ? "Month closed"
            : "Month in progress"}
        </span>
      </div>
    </section>
  );
}