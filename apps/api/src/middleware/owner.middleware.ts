import type { RequestHandler } from "express";

import { prisma } from "../lib/prisma.js";

export const requireOwner: RequestHandler = async (
  req,
  res,
  next,
) => {
  if (!req.auth) {
    res.status(401).json({
      error: "Authentication required",
    });

    return;
  }

  try {
    const membership =
      await prisma.householdMember.findUnique({
        where: {
          householdId_userId: {
            householdId: req.auth.householdId,
            userId: req.auth.userId,
          },
        },
      });

    if (!membership || membership.role !== "owner") {
      res.status(403).json({
        error:
          "Insufficient privileges. Check with your administrator!",
      });

      return;
    }

    next();
  } catch (error) {
    console.error("Authorization failed:", error);

    res.status(500).json({
      error: "Unable to verify permissions",
    });

    return;
  }
};