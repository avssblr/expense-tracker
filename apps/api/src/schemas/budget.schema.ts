import { z } from "zod";

export const budgetSchema = z.object({
  plannedAmount: z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .refine(
      (value) => /^\d+(\.\d{1,2})?$/.test(value),
      "Budget must have at most two decimal places",
    )
    .refine(
      (value) => Number(value) >= 0,
      "Budget cannot be negative",
    ),
});