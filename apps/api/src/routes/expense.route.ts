import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getRequestContext } from "../lib/request-contex.js";
import { isHouseholdMember } from "../lib/access.js";
import {
  createExpenseSchema,
  monthSchema,
} from "../schemas/expense.schema.js";

const router = Router();

function monthRange(month: string) {
  const [yearPart, monthPart] = month.split("-");
  const year = Number(yearPart);
  const monthNumber = Number(monthPart);

  const start = new Date(
    Date.UTC(year, monthNumber - 1, 1),
  );

  const end = new Date(
    Date.UTC(year, monthNumber, 1),
  );

  return {
    start,
    end,
  };
}

function serializeExpense(expense: any) {
  return {
    ...expense,

    amount: expense.amount.toString(),

    expenseDate: expense.expenseDate
      .toISOString()
      .slice(0, 10),
  };
}

router.post("/", async (req, res) => {
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

    const result = createExpenseSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid expense",
        details: result.error.issues,
      });
    }

    const {
      categoryId,
      paymentMethodId,
      amount,
      expenseDate,
      description,
      notes,
    } = result.data;

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        householdId,
        isActive: true,
      },
    });

    if (!category) {
      return res.status(400).json({
        error: "Invalid category",
      });
    }

    if (paymentMethodId) {
      const paymentMethod =
        await prisma.paymentMethod.findFirst({
          where: {
            id: paymentMethodId,
            householdId,
            isActive: true,
          },
        });

      if (!paymentMethod) {
        return res.status(400).json({
          error: "Invalid payment method",
        });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        householdId,
        categoryId,
        createdByUserId: userId,

        paymentMethodId:
          paymentMethodId ?? null,

        amount,

        expenseDate: new Date(
          `${expenseDate}T00:00:00.000Z`,
        ),

        description,

        notes: notes ?? null,
      },

      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },

        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(
      serializeExpense(expense),
    );
  } catch (error) {
    console.error("Create expense failed:", error);

    res.status(500).json({
      error: "Unable to create expense",
    });
  }
});

router.get("/", async (req, res) => {
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

    const monthResult =
      monthSchema.safeParse(req.query.month);

    if (!monthResult.success) {
      return res.status(400).json({
        error: "Query parameter month must be YYYY-MM",
      });
    }

    const { start, end } =
      monthRange(monthResult.data);

    const expenses = await prisma.expense.findMany({
      where: {
        householdId,

        expenseDate: {
          gte: start,
          lt: end,
        },
      },

      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },

        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: [
        {
          expenseDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    res.json(
      expenses.map(serializeExpense),
    );
  } catch (error) {
    console.error("Retrieve expenses failed:", error);

    res.status(500).json({
      error: "Unable to retrieve expenses",
    });
  }
});

export default router;