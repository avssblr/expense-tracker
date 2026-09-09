import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { getRequestContext } from "../lib/request-contex.js";
import { isHouseholdMember } from "../lib/access.js";
import { budgetSchema } from "../schemas/budget.schema.js";
import { parseMonth } from "../utils/month.js";

const router = Router();

router.put("/:month/:categoryId", async (req, res) => {
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
    const categoryId = Number(req.params.categoryId);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      return res.status(400).json({
        error: "Invalid category ID",
      });
    }

    let monthDate: Date;

    try {
      monthDate = parseMonth(month).start;
    } catch {
      return res.status(400).json({
        error: "Month must be in YYYY-MM format",
      });
    }

    const result = budgetSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid budget",
        details: result.error.issues,
      });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        householdId,
      },
    });

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    const budget = await prisma.monthlyBudget.upsert({
      where: {
        householdId_categoryId_month: {
          householdId,
          categoryId,
          month: monthDate,
        },
      },

      update: {
        plannedAmount: result.data.plannedAmount,
      },

      create: {
        householdId,
        categoryId,
        month: monthDate,
        plannedAmount: result.data.plannedAmount,
      },

      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      ...budget,
      month,
      plannedAmount:
        budget.plannedAmount.toString(),
    });
  } catch (error) {
    console.error("Budget update failed:", error);

    res.status(500).json({
      error: "Unable to save budget",
    });
  }
});

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

    let monthDate: Date;

    try {
      monthDate = parseMonth(month).start;
    } catch {
      return res.status(400).json({
        error: "Month must be in YYYY-MM format",
      });
    }

    const budgets =
      await prisma.monthlyBudget.findMany({
        where: {
          householdId,
          month: monthDate,
        },

        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          category: {
            name: "asc",
          },
        },
      });

    res.json(
      budgets.map((budget) => ({
        ...budget,
        month,
        plannedAmount:
          budget.plannedAmount.toString(),
      })),
    );
  } catch (error) {
    console.error("Budget retrieval failed:", error);

    res.status(500).json({
      error: "Unable to retrieve budgets",
    });
  }
});

export default router;