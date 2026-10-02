import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { getRequestContext } from "../lib/request-contex.js";
import { isHouseholdMember } from "../lib/access.js";
import { parseMonth } from "../utils/month.js";

import {
  centsToMoney,
  moneyToCents,
  percent,
} from "../utils/money.js";

import {
  getMonthFinance,
} from "../services/month-finance.service.js";

const router = Router();

router.get("/:month", async (req, res) => {
  try {
    /*
     * --------------------------------------------------
     * 1. AUTHENTICATED HOUSEHOLD CONTEXT
     * --------------------------------------------------
     */
    const {
      householdId,
      userId,
    } = getRequestContext(req);

    const allowed =
      await isHouseholdMember(
        householdId,
        userId,
      );

    if (!allowed) {
      res.status(403).json({
        error:
          "You are not a member of this household",
      });

      return;
    }

    /*
     * --------------------------------------------------
     * 2. VALIDATE SELECTED MONTH
     * --------------------------------------------------
     */
    const month = req.params.month;

    if (typeof month !== "string") {
      res.status(400).json({
        error:
          "Month must be in YYYY-MM format",
      });

      return;
    }

    let start: Date;
    let end: Date;

    try {
      const range =
        parseMonth(month);

      start = range.start;
      end = range.end;
    } catch {
      res.status(400).json({
        error:
          "Month must be in YYYY-MM format",
      });

      return;
    }

    /*
     * --------------------------------------------------
     * 3. CALCULATE MONTH FINANCES
     * --------------------------------------------------
     *
     * getMonthFinance() calculates:
     *
     * - category budget total
     * - eligible carry-forward
     * - available/incoming money
     * - actual spending
     * - remaining money
     *
     * IMPORTANT:
     *
     * Carry-forward becomes available only after
     * the previous calendar month has ended.
     *
     * Example:
     *
     * September 28 while viewing October:
     * carry-forward = 0
     *
     * October 1:
     * September's positive remaining balance
     * becomes October carry-forward.
     */
    const finance =
      await getMonthFinance(
        householdId,
        month,
      );

    /*
     * --------------------------------------------------
     * 4. LOAD CURRENT-MONTH DATA
     * --------------------------------------------------
     *
     * No monthlyPlan query anymore.
     *
     * MonthlyBudget is now the authoritative
     * source for the month's planned allocation.
     */
    const [
      budgets,
      expenseGroups,
      expenses,
      allCategories,
    ] = await Promise.all([
      /*
       * Category budgets for selected month.
       */
      prisma.monthlyBudget.findMany({
        where: {
          householdId,
          month: start,
        },

        include: {
          category: {
            select: {
              id: true,
              name: true,

              parent: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),

      /*
       * Spending grouped by category.
       */
      prisma.expense.groupBy({
        by: ["categoryId"],

        where: {
          householdId,

          expenseDate: {
            gte: start,
            lt: end,
          },
        },

        _sum: {
          amount: true,
        },
      }),

      /*
       * Individual expenses needed for
       * the Daily Spending Trend.
       */
      prisma.expense.findMany({
        where: {
          householdId,

          expenseDate: {
            gte: start,
            lt: end,
          },
        },

        select: {
          amount: true,
          expenseDate: true,
        },
      }),

      /*
       * Used for chart/category names.
       */
      prisma.category.findMany({
        where: {
          householdId,
        },

        select: {
          id: true,
          name: true,
          parentId: true,

          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    /*
     * --------------------------------------------------
     * 5. CATEGORY SPENDING LOOKUP
     * --------------------------------------------------
     */
    const spendByCategory =
      new Map<number, bigint>();

    for (
      const group
      of expenseGroups
    ) {
      spendByCategory.set(
        group.categoryId,

        group._sum.amount
          ? moneyToCents(
              group._sum.amount,
            )
          : 0n,
      );
    }

    /*
     * --------------------------------------------------
     * 6. CATEGORY BUDGET STATUS
     * --------------------------------------------------
     *
     * These are categories that actually
     * have a budget configured for this month.
     */
    const categories =
      budgets.map((budget) => {
        const budgetCents =
          moneyToCents(
            budget.plannedAmount,
          );

        const categorySpent =
          spendByCategory.get(
            budget.categoryId,
          ) ?? 0n;

        const remaining =
          budgetCents -
          categorySpent;

        const utilization =
          percent(
            categorySpent,
            budgetCents,
          );

        let status:
          | "OK"
          | "WARNING"
          | "CRITICAL"
          | "EXCEEDED" =
          "OK";

        if (
          utilization !== null &&
          utilization >= 100
        ) {
          status = "EXCEEDED";
        } else if (
          utilization !== null &&
          utilization >= 90
        ) {
          status = "CRITICAL";
        } else if (
          utilization !== null &&
          utilization >= 70
        ) {
          status = "WARNING";
        }

        /*
         * If this is a subcategory,
         * display:
         *
         * Subscriptions › Netflix
         *
         * instead of only:
         *
         * Netflix
         */
        const categoryName =
          budget.category.parent
            ? `${budget.category.parent.name} › ${budget.category.name}`
            : budget.category.name;

        return {
          categoryId:
            budget.categoryId,

          category:
            categoryName,

          budget:
            centsToMoney(
              budgetCents,
            ),

          spent:
            centsToMoney(
              categorySpent,
            ),

          remaining:
            centsToMoney(
              remaining,
            ),

          utilizationPercent:
            utilization,

          status,
        };
      });

    /*
     * --------------------------------------------------
     * 7. DAILY SPENDING TREND
     * --------------------------------------------------
     */
    const dailyTotals =
      new Map<string, bigint>();

    for (
      const expense
      of expenses
    ) {
      const date =
        expense.expenseDate
          .toISOString()
          .slice(0, 10);

      const existing =
        dailyTotals.get(date) ??
        0n;

      dailyTotals.set(
        date,

        existing +
          moneyToCents(
            expense.amount,
          ),
      );
    }

    const dailySpending: {
      date: string;
      amount: string;
    }[] = [];

    /*
     * Include every calendar day,
     * including zero-expense days.
     */
    for (
      let day =
        new Date(start);

      day < end;

      day.setUTCDate(
        day.getUTCDate() + 1,
      )
    ) {
      const date =
        day
          .toISOString()
          .slice(0, 10);

      dailySpending.push({
        date,

        amount:
          centsToMoney(
            dailyTotals.get(date) ??
              0n,
          ),
      });
    }

    /*
     * --------------------------------------------------
     * 8. CATEGORY LABEL LOOKUP
     * --------------------------------------------------
     *
     * Also supports parent › child naming
     * in the pie chart.
     */
    const categoryNames =
      new Map<number, string>();

    for (
      const category
      of allCategories
    ) {
      const label =
        category.parent
          ? `${category.parent.name} › ${category.name}`
          : category.name;

      categoryNames.set(
        category.id,
        label,
      );
    }

    /*
     * --------------------------------------------------
     * 9. PIE CHART SPENDING DISTRIBUTION
     * --------------------------------------------------
     *
     * IMPORTANT:
     *
     * This is based on ACTUAL EXPENSES,
     * not budgets.
     *
     * Therefore a category with no budget
     * still appears in the pie chart if
     * money was spent in that category.
     */
    const spendingDistribution =
      expenseGroups.map(
        (group) => ({
          categoryId:
            group.categoryId,

          category:
            categoryNames.get(
              group.categoryId,
            ) ?? "Unknown",

          amount:
            centsToMoney(
              group._sum.amount
                ? moneyToCents(
                    group._sum.amount,
                  )
                : 0n,
            ),
        }),
      );

    /*
     * --------------------------------------------------
     * 10. DASHBOARD RESPONSE
     * --------------------------------------------------
     */
    res.json({
      month,

      summary: {
        /*
         * Sum of category budgets
         * entered for this month.
         */
        budgetTotal:
          centsToMoney(
            finance
              .budgetTotalCents,
          ),

        /*
         * Positive remaining money from
         * previous month, only after that
         * calendar month has ended.
         */
        carryForward:
          centsToMoney(
            finance
              .carryForwardCents,
          ),

        /*
         * Available This Month:
         *
         * category budget total
         * +
         * finalized carry-forward
         */
        incoming:
          centsToMoney(
            finance
              .incomingCents,
          ),

        /*
         * ALL actual expenses for
         * selected month.
         */
        spent:
          centsToMoney(
            finance
              .spentCents,
          ),

        /*
         * Available - Actual Expenses
         */
        remaining:
          centsToMoney(
            finance
              .remainingCents,
          ),

        utilizationPercent:
          percent(
            finance
              .spentCents,

            finance
              .incomingCents,
          ),

        status:
          finance
            .remainingCents < 0n
            ? "OVERSPENT"
            : "OK",

        /*
         * Useful frontend metadata.
         */
        carryForwardApplied:
          finance
            .carryForwardApplied,

        carryForwardSourceMonth:
          finance
            .carryForwardSourceMonth,

        isClosed:
          finance.isClosed,
      },

      /*
       * Budget progress cards.
       */
      categories,

      /*
       * Daily line chart.
       */
      dailySpending,

      /*
       * Pie/donut chart.
       */
      spendingDistribution,

      /*
       * Income vs expense chart.
       */
      comparison: {
        income:
          centsToMoney(
            finance
              .incomingCents,
          ),

        expenses:
          centsToMoney(
            finance
              .spentCents,
          ),
      },
    });
  } catch (error) {
    console.error(
      "Dashboard failed:",
      error,
    );

    res.status(500).json({
      error:
        "Unable to generate dashboard",
    });
  }
});

export default router;