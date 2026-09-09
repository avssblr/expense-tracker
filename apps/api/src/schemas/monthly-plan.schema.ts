import { z } from "zod";

export const monthlyPlanSchema = z.object({
  plannedIncome: z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .refine(
      (value) => /^\d+(\.\d{1,2})?$/.test(value),
      "Income must have at most two decimal places",
    )
    .refine(
      (value) => Number(value) >= 0,
      "Income cannot be negative",
    ),

  notes: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .optional(),
});