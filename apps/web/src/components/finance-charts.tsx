"use client";

import{
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    BarChart,
    Bar,
} from "recharts";

import type { Dashboard } from "@/types/dashboard";

const COLORS = [
  "#6366F1",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F97316",
];

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

type Props = {
  dashboard: Dashboard;
};

export default function FinanceCharts({
  dashboard,
}: Props) {
  const distribution = dashboard.spendingDistribution.map(
    (item) => ({
      name: item.category,
      value: Number(item.amount),
    }),
  ).filter((item) => item.value > 0);

  const daily = dashboard.dailySpending.map(
    (item) => ({
      date: item.date.slice(8),
      amount: Number(item.amount),
    }),
  );

  const comparison = [
    {
      name: "Available",
      amount: Number(dashboard.comparison.income),
    },
    {
      name: "Expenses",
      amount: Number(dashboard.comparison.expenses),
    },
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Spending by Category
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Where your household money goes
        </p>

        {distribution.length === 0 ? (
          <p className="mt-8 text-gray-500">
            No expenses recorded for this month.
          </p>
        ) : (
          <div className="mt-5 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="42%"
                  outerRadius="70%"
                  paddingAngle={3}
                >
                  {distribution.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) =>
                    money(Number(value))
                  }
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Available vs Expenses
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Monthly cash-flow comparison
        </p>

        <div className="mt-5 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparison}
              margin={{
                top: 10,
                right: 10,
                left: 5,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="name" />

              <YAxis
                width={70}
                tickFormatter={(value) =>
                  `₹${(value / 1000).toFixed(0)}k`
                }
              />

              <Tooltip
                formatter={(value) =>
                  money(Number(value))
                }
              />

              <Bar
                dataKey="amount"
                radius={[8, 8, 0, 0]}
              >
                <Cell fill="#10B981" />
                <Cell fill="#F472B6" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
        <h2 className="text-lg font-bold text-gray-900">
          Daily Spending Trend
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Expense activity throughout the selected month
        </p>

        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={daily}
              margin={{
                top: 10,
                right: 10,
                left: 5,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickMargin={8}
              />

              <YAxis
                width={70}
                tickFormatter={(value) =>
                  `₹${(value / 1000).toFixed(0)}k`
                }
              />

              <Tooltip
                formatter={(value) =>
                  money(Number(value))
                }
              />

              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}