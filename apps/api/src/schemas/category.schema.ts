import {z} from "zod";

export const createCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Category name is required")
        .max(80),

    parentId: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),
});

export const updateCategorySchema = z.object({
    name: z 
        .string()
        .trim()
        .min(1, "Category name is required")
        .max(80),
});

export const deleteCategorySchema = z.discriminatedUnion(
    "mode",
    [
        z.object({
            mode: z.literal("category"),
        }),

        z.object({
            mode: z.literal("subcategories"),

            subcategoryIds: z
                .array(
                    z.number().int().positive(),
                )
                .min(
                    1, "Select at least one subcategory"
                ),
        }),

    ],
);