import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { getRequestContext } from "../lib/request-contex.js";
import { isHouseholdMember } from "../lib/access.js";
import { monthlyPlanSchema } from "../schemas/monthly-plan.schema.js";
import { parseMonth } from "../utils/month.js";
import { requireOwner } from "../middleware/owner.middleware.js";

const router = Router();

router.put("/:month", requireOwner, async (req, res) => {
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

    if (typeof month !== "string") {
      return res.status(400).json({
        error: "Invalid month parameter",
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

    const result =
      monthlyPlanSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid monthly plan",
        details: result.error.issues,
      });
    }

    const plan = await prisma.monthlyPlan.upsert({
      where: {
        householdId_month: {
          householdId,
          month: monthDate,
        },
      },

      update: {
        plannedIncome: result.data.plannedIncome,
        notes: result.data.notes ?? null,
      },

      create: {
        householdId,
        month: monthDate,
        plannedIncome: result.data.plannedIncome,
        notes: result.data.notes ?? null,
      },
    });

    res.json({
      ...plan,
      month,
      plannedIncome: plan.plannedIncome.toString(),
    });
  } catch (error) {
    console.error("Monthly plan failed:", error);

    res.status(500).json({
      error: "Unable to save monthly plan",
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

    const month = req.params.month;

    if (typeof month !== "string") {
      return res.status(400).json({
        error: "Invalid month parameter",
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

    const plan = await prisma.monthlyPlan.findUnique({
      where: {
        householdId_month: {
          householdId,
          month: monthDate,
        },
      },
    });

    if (!plan) {
      return res.status(404).json({
        error: "No monthly plan found",
      });
    }

    res.json({
      ...plan,
      month,
      plannedIncome: plan.plannedIncome.toString(),
    });
  } catch (error) {
    console.error("Monthly plan retrieval failed:", error);

    res.status(500).json({
      error: "Unable to retrieve monthly plan",
    });
  }
});

export default router;