import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getRequestContext } from "../lib/request-contex.js";
import { isHouseholdMember } from "../lib/access.js";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const { householdId, userId } = getRequestContext(req);

    const allowed = await isHouseholdMember(householdId, userId);

    if (!allowed) {
      return res.status(403).json({
        error: "You are not a member of this household",
      });
    }

    const categories = await prisma.category.findMany({
      where: {
        householdId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(categories);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve categories",
    });
  }
});

router.get("/payment-methods", async (req, res) => {
  try {
    const { householdId, userId } = getRequestContext(req);

    const allowed = await isHouseholdMember(householdId, userId);

    if (!allowed) {
      return res.status(403).json({
        error: "You are not a member of this household",
      });
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        householdId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(paymentMethods);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve payment methods",
    });
  }
});

export default router;