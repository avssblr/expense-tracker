import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { getRequestContext } from "../lib/request-contex.js";
import { isHouseholdMember } from "../lib/access.js";
import { budgetSchema } from "../schemas/budget.schema.js";
import { parseMonth } from "../utils/month.js";
import { requireOwner } from "../middleware/owner.middleware.js";

const router = Router();

router.post(
  "/:month/copy-previous",
  requireOwner,
  async (req, res) => {
    try {
      const { householdId } =
        getRequestContext(req);

      const month = req.params.month;

      if (typeof month !== "string") {
        res.status(400).json({
          error: "Invalid month",
        });

        return;
      }

      let currentMonthStart: Date;

      try {
        currentMonthStart =
          parseMonth(month).start;
      } catch {
        res.status(400).json({
          error:
            "Month must be in YYYY-MM format",
        });

        return;
      }

      const previousMonthStart =
        new Date(currentMonthStart);

      previousMonthStart.setUTCMonth(
        previousMonthStart.getUTCMonth() - 1,
      );

      const previousBudgets =
        await prisma.monthlyBudget.findMany({
          where: {
            householdId,
            month: previousMonthStart,
          },

          include: {
            category: {
              select: {
                id: true,

                children: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        });

      /*
       * Only copy leaf-category budgets.
       * Parent categories such as Loans
       * or Subscriptions are grouping
       * containers only.
       */
      const leafBudgets =
        previousBudgets.filter(
          (budget) =>
            budget.category.children
              .length === 0,
        );

      if (leafBudgets.length === 0) {
        res.status(404).json({
          error:
            "No category budgets were found in the previous month",
        });

        return;
      }

      /*
       * Replace this month's budget setup
       * with the previous month's values.
       */
      await prisma.$transaction(
        async (tx) => {
          await tx.monthlyBudget.deleteMany({
            where: {
              householdId,
              month: currentMonthStart,
            },
          });

          await tx.monthlyBudget.createMany({
            data: leafBudgets.map(
              (budget) => ({
                householdId,

                categoryId:
                  budget.categoryId,

                month:
                  currentMonthStart,

                plannedAmount:
                  budget.plannedAmount,
              }),
            ),
          });
        },
      );

      /*
       * Return the new values so the
       * frontend can immediately update
       * without requiring a full reload.
       */
      const copiedBudgets =
        await prisma.monthlyBudget.findMany({
          where: {
            householdId,
            month: currentMonthStart,
          },

          orderBy: {
            categoryId: "asc",
          },
        });

      res.json({
        message:
          "Previous month budgets copied successfully",

        copiedCount:
          copiedBudgets.length,

        budgets:
          copiedBudgets.map(
            (budget) => ({
              categoryId:
                budget.categoryId,

              plannedAmount:
                budget.plannedAmount.toString(),
            }),
          ),
      });
    } catch (error) {
      console.error(
        "Copy previous budgets failed:",
        error,
      );

      res.status(500).json({
        error:
          "Unable to copy previous month budgets",
      });
    }
  },
);

router.put("/:month/:categoryId", requireOwner, async (req, res) => {
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

    const month = req.params.month;
    const categoryId = Number(req.params.categoryId);

    if (typeof month !== "string") {
      return res.status(400).json({
        error: "Invalid month parameter",
      });
    }

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