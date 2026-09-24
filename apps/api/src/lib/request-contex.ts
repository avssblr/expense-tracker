import type { Request } from "express";

export function getRequestContext(
  req: Request,
) {
  if (!req.auth) {
    throw new Error(
      "Authentication context is missing",
    );
  }

  return {
    householdId:
      req.auth.householdId,

    userId:
      req.auth.userId,

    role:
      req.auth.role,
  };
}