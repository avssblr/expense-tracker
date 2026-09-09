import type { Request } from "express";

export function getRequestContext(req: Request) {
  const householdId = Number(req.header("x-household-id") ?? "1");
  const userId = Number(req.header("x-user-id") ?? "1");

  if (!Number.isInteger(householdId) || householdId <= 0) {
    throw new Error("Invalid household ID");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID");
  }

  return {
    householdId,
    userId,
  };
}