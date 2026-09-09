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

const router = Router();

router.get("/:month", async (req, res) => {
  try {
    const { householdId, userId } =
      getRequestContext(req);

    const allowed = await isHouseholdMember(
      householdId,
      userId,
    );

    if (!allowed) {
      return res.status(403).json({
        error: "You are not a member of this household",
      });
    }

    const { month } = req.params;

    let start: Date;
    let end: Date;

    try {
      const range = parseMonth(month);

      start = range.start;
      end = range.end;
    } catch {
      return res.status(400).json({
        error: "Month must be in YYYY-MM format",
      });
    }

    const [
      plan,
      budgets,
      totalExpense,
      expenseGroups,
    ] = await Promise.all([
      prisma.monthlyPlan.findUnique({
        where: {
          householdId_month: {
            householdId,
            month: start,
          },
        },
      }),

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
            },
          },
        },
      }),

      prisma.expense.aggregate({
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
    ]);

    const incomeCents = plan
      ? moneyToCents(plan.plannedIncome)
      : 0n;

    const spentCents = totalExpense._sum.amount
      ? moneyToCents(totalExpense._sum.amount)
      : 0n;

    const remainingCents =
      incomeCents - spentCents;

    const spendByCategory = new Map<
      number,
      bigint
    >();

    for (const group of expenseGroups) {
      spendByCategory.set(
        group.categoryId,
        group._sum.amount
          ? moneyToCents(group._sum.amount)
          : 0n,
      );
    }

    const categories = budgets.map((budget) => {
      const budgetCents = moneyToCents(
        budget.plannedAmount,
      );

      const categorySpent =
        spendByCategory.get(budget.categoryId) ??
        0n;

      const remaining =
        budgetCents - categorySpent;

      const utilization =
        percent(categorySpent, budgetCents);

      let status = "OK";

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

      return {
        categoryId: budget.categoryId,
        category: budget.category.name,

        budget: centsToMoney(budgetCents),

        spent:
          centsToMoney(categorySpent),

        remaining:
          centsToMoney(remaining),

        utilizationPercent:
          utilization,

        status,
      };
    });

    res.json({
      month,

      summary: {
        incoming:
          centsToMoney(incomeCents),

        spent:
          centsToMoney(spentCents),

        remaining:
          centsToMoney(remainingCents),

        utilizationPercent:
          percent(spentCents, incomeCents),

        status:
          remainingCents < 0n
            ? "OVERSPENT"
            : "OK",
      },

      categories,
    });
  } catch (error) {
    console.error("Dashboard failed:", error);

    res.status(500).json({
      error: "Unable to generate dashboard",
    });
  }
});

export default router;