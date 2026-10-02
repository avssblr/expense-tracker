import { prisma } from "../lib/prisma.js";

import {
  moneyToCents,
} from "../utils/money.js";

export type MonthFinanceResult = {
  month: string;

  budgetTotalCents: bigint;
  carryForwardCents: bigint;
  incomingCents: bigint;
  spentCents: bigint;
  remainingCents: bigint;

  carryForwardApplied: boolean;
  carryForwardSourceMonth: string | null;
  isClosed: boolean;
};

function validateMonth(
  month: string,
) {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      month,
    )
  ) {
    throw new Error(
      "Month must be in YYYY-MM format",
    );
  }
}

function monthStart(
  month: string,
): Date {
  validateMonth(month);

  return new Date(
    `${month}-01T00:00:00.000Z`,
  );
}

function nextMonth(
  month: string,
): string {
  const date =
    monthStart(month);

  date.setUTCMonth(
    date.getUTCMonth() + 1,
  );

  return date
    .toISOString()
    .slice(0, 7);
}

function previousMonth(
  month: string,
): string {
  const date =
    monthStart(month);

  date.setUTCMonth(
    date.getUTCMonth() - 1,
  );

  return date
    .toISOString()
    .slice(0, 7);
}

function getCurrentMonth(
  now = new Date(),
): string {
  const timeZone =
    process.env
      .HOUSEHOLD_TIME_ZONE ??
    "Asia/Kolkata";

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
      },
    ).formatToParts(now);

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  if (!year || !month) {
    throw new Error(
      "Unable to determine current month",
    );
  }

  return `${year}-${month}`;
}

export async function getMonthFinance(
  householdId: number,
  selectedMonth: string,
  now = new Date(),
): Promise<MonthFinanceResult> {
  validateMonth(selectedMonth);

  const currentMonth =
    getCurrentMonth(now);

  /*
   * Determine the earliest month
   * containing either budgets or
   * expenses.
   */
  const [
    firstBudget,
    firstExpense,
  ] = await Promise.all([
    prisma.monthlyBudget.findFirst({
      where: {
        householdId,
      },

      orderBy: {
        month: "asc",
      },

      select: {
        month: true,
      },
    }),

    prisma.expense.findFirst({
      where: {
        householdId,
      },

      orderBy: {
        expenseDate: "asc",
      },

      select: {
        expenseDate: true,
      },
    }),
  ]);

  const firstBudgetMonth =
    firstBudget
      ? firstBudget.month
          .toISOString()
          .slice(0, 7)
      : null;

  const firstExpenseMonth =
    firstExpense
      ? firstExpense.expenseDate
          .toISOString()
          .slice(0, 7)
      : null;

  let startMonth =
    selectedMonth;

  if (
    firstBudgetMonth &&
    firstBudgetMonth <
      startMonth
  ) {
    startMonth =
      firstBudgetMonth;
  }

  if (
    firstExpenseMonth &&
    firstExpenseMonth <
      startMonth
  ) {
    startMonth =
      firstExpenseMonth;
  }

  const rangeStart =
    monthStart(startMonth);

  const rangeEnd =
    monthStart(
      nextMonth(
        selectedMonth,
      ),
    );

  /*
   * Retrieve all relevant budgets
   * and expenses from the beginning
   * of financial history through the
   * selected month.
   */
  const [
    budgets,
    expenses,
  ] = await Promise.all([
    prisma.monthlyBudget.findMany({
      where: {
        householdId,

        month: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },

      select: {
        month: true,
        plannedAmount: true,
        categoryId: true,

        category: {
          select: {
            children: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    }),

    prisma.expense.findMany({
      where: {
        householdId,

        expenseDate: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },

      select: {
        expenseDate: true,
        amount: true,
      },
    }),
  ]);

  /*
   * Group monthly budgets.
   *
   * Parent categories are excluded
   * because only leaf categories
   * should contribute to the total.
   */
  const budgetsByMonth =
    new Map<string, bigint>();

  for (
    const budget
    of budgets
  ) {
    if (
      budget.category
        .children.length > 0
    ) {
      continue;
    }

    const month =
      budget.month
        .toISOString()
        .slice(0, 7);

    const existing =
      budgetsByMonth.get(
        month,
      ) ?? 0n;

    budgetsByMonth.set(
      month,

      existing +
        moneyToCents(
          budget.plannedAmount,
        ),
    );
  }

  /*
   * Group expenses by the month in
   * which the expense actually occurred.
   */
  const expensesByMonth =
    new Map<string, bigint>();

  for (
    const expense
    of expenses
  ) {
    const month =
      expense.expenseDate
        .toISOString()
        .slice(0, 7);

    const existing =
      expensesByMonth.get(
        month,
      ) ?? 0n;

    expensesByMonth.set(
      month,

      existing +
        moneyToCents(
          expense.amount,
        ),
    );
  }

  let processingMonth =
    startMonth;

  let previousRemaining =
    0n;

  let result:
    MonthFinanceResult | null =
    null;

  while (
    processingMonth <=
    selectedMonth
  ) {
    const budgetTotalCents =
      budgetsByMonth.get(
        processingMonth,
      ) ?? 0n;

    const spentCents =
      expensesByMonth.get(
        processingMonth,
      ) ?? 0n;

    /*
     * Carry forward is allowed only
     * when the receiving month has
     * actually started.
     *
     * Example:
     *
     * On Sep 28:
     * October has NOT started.
     * September balance cannot yet
     * enter October.
     *
     * On Oct 1:
     * October has started.
     * September is closed and its
     * positive balance can carry.
     */
    const canReceiveCarry =
      processingMonth >
        startMonth &&
      processingMonth <=
        currentMonth;

    const carryForwardCents =
      canReceiveCarry &&
      previousRemaining > 0n
        ? previousRemaining
        : 0n;

    const incomingCents =
      budgetTotalCents +
      carryForwardCents;

    const remainingCents =
      incomingCents -
      spentCents;
    
    const carryForwardApplied = carryForwardCents > 0n;

    if (
      processingMonth ===
      selectedMonth
    ) {
      result = {
        month:
          processingMonth,

        budgetTotalCents,

        carryForwardCents,

        incomingCents,

        spentCents,

        remainingCents,

        carryForwardApplied,

        carryForwardSourceMonth:
            carryForwardApplied
                ? previousMonth(
                    processingMonth,
                )
                : null,

            isClosed:
            processingMonth <
            currentMonth,
        };
    }

    previousRemaining =
      remainingCents;

    processingMonth =
      nextMonth(
        processingMonth,
      );
  }

  if (!result) {
    throw new Error(
      "Unable to calculate monthly finances",
    );
  }

  return result;
}