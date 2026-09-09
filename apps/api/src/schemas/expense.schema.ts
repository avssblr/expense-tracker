import { z } from "zod";

function isValidDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export const createExpenseSchema = z.object({
  categoryId: z.number().int().positive(),

  paymentMethodId: z.number().int().positive().nullable().optional(),

  amount: z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .refine(
      (value) => /^\d+(\.\d{1,2})?$/.test(value),
      "Amount must have at most two decimal places",
    )
    .refine(
      (value) => Number(value) > 0,
      "Amount must be greater than zero",
    ),

  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidDate, "Invalid expense date"),

  description: z.string().trim().min(1).max(200),

  notes: z.string().trim().max(1000).nullable().optional(),
});

export const monthSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    "Month must be in YYYY-MM format",
  );