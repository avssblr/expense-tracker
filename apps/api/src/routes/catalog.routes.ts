import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getRequestContext } from "../lib/request-contex.js";
import { isHouseholdMember } from "../lib/access.js";
import { requireOwner } from "../middleware/owner.middleware.js";
import{
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "../schemas/category.schema.js"; 

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const { householdId } =
      getRequestContext(req);

    const categories =
      await prisma.category.findMany({
        where: {
          householdId,
          isActive: true,
        },

        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },

          children: {
            where: {
              isActive: true,
            },

            select: {
              id: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      });

    res.json(
      categories.map((category) => ({
        id: category.id,
        name: category.name,

        parentId: category.parentId,
        isActive: category.isActive,

        parent: category.parent,

        hasChildren:
          category.children.length > 0,
      })),
    );
  } catch (error) {
    console.error(
      "Category retrieval failed:",
      error,
    );

    res.status(500).json({
      error: "Unable to retrieve categories",
    });
  }
});

router.get(
  "/categories/tree",
  async (req, res) => {
    try {
      const { householdId } =
        getRequestContext(req);

      const categories =
        await prisma.category.findMany({
          where: {
            householdId,
            isActive: true,
            parentId: null,
          },

          select: {
            id: true,
            name: true,
            parentId: true,
            isActive: true,

            children: {
              where: {
                isActive: true,
              },

              select: {
                id: true,
                name: true,
                parentId: true,
                isActive: true,
              },

              orderBy: {
                name: "asc",
              },
            },
          },

          orderBy: {
            name: "asc",
          },
        });

      res.json(categories);
    } catch (error) {
      console.error(
        "Category tree retrieval failed:",
        error,
      );

      res.status(500).json({
        error:
          "Unable to retrieve category tree",
      });
    }
  },
);

router.post(
  "/categories",
  requireOwner,
  async (req, res) => {
    try {
      const { householdId } =
        getRequestContext(req);

      const parsed =
        createCategorySchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid category",
          details: parsed.error.flatten(),
        });

        return;
      }

      const name = parsed.data.name;
      const parentId =
        parsed.data.parentId ?? null;

      if (parentId !== null) {
        const parent =
          await prisma.category.findFirst({
            where: {
              id: parentId,
              householdId,
              isActive: true,
            },
          });

        if (!parent) {
          res.status(400).json({
            error:
              "Parent category does not exist",
          });

          return;
        }

        if (parent.parentId !== null) {
          res.status(400).json({
            error:
              "Only one level of subcategories is supported",
          });

          return;
        }
      }

      const duplicate =
        await prisma.category.findFirst({
          where: {
            householdId,
            parentId,
            isActive: true,

            name: {
              equals: name,
              mode: "insensitive",
            },
          },
        });

      if (duplicate) {
        res.status(409).json({
          error:
            "A category with this name already exists here",
        });

        return;
      }

      const category =
        await prisma.category.create({
          data: {
            householdId,
            name,
            parentId,
          },
        });

      res.status(201).json(category);
    } catch (error) {
      console.error(
        "Category creation failed:",
        error,
      );

      res.status(500).json({
        error: "Unable to create category",
      });
    }
  },
);

router.put(
  "/categories/:id",
  requireOwner,
  async (req, res) => {
    try {
      const { householdId } =
        getRequestContext(req);

      const rawId = req.params.id;

      if (typeof rawId !== "string") {
        res.status(400).json({
          error: "Invalid category ID",
        });

        return;
      }

      const id = Number(rawId);

      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          error: "Invalid category ID",
        });

        return;
      }

      const parsed =
        updateCategorySchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid category update",
        });

        return;
      }

      const existing =
        await prisma.category.findFirst({
          where: {
            id,
            householdId,
            isActive: true,
          },
        });

      if (!existing) {
        res.status(404).json({
          error: "Category not found",
        });

        return;
      }

      const duplicate =
        await prisma.category.findFirst({
          where: {
            householdId,
            parentId: existing.parentId,
            isActive: true,

            id: {
              not: id,
            },

            name: {
              equals: parsed.data.name,
              mode: "insensitive",
            },
          },
        });

      if (duplicate) {
        res.status(409).json({
          error:
            "A category with this name already exists here",
        });

        return;
      }

      const updated =
        await prisma.category.update({
          where: {
            id,
          },

          data: {
            name: parsed.data.name,
          },
        });

      res.json(updated);
    } catch (error) {
      console.error(
        "Category update failed:",
        error,
      );

      res.status(500).json({
        error: "Unable to update category",
      });
    }
  },
);

router.post(
  "/categories/:id/delete",
  requireOwner,
  async (req, res) => {
    try {
      const { householdId } =
        getRequestContext(req);

      const rawId = req.params.id;

      if (typeof rawId !== "string") {
        res.status(400).json({
          error: "Invalid category ID",
        });

        return;
      }

      const categoryId = Number(rawId);

      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      ) {
        res.status(400).json({
          error: "Invalid category ID",
        });

        return;
      }

      const parsed =
        deleteCategorySchema.safeParse(
          req.body,
        );

      if (!parsed.success) {
        res.status(400).json({
          error:
            "Invalid category deletion request",

          details:
            parsed.error.flatten(),
        });

        return;
      }

      /*
       * Only a ROOT category can be the
       * starting point for deletion.
       */
      const category =
        await prisma.category.findFirst({
          where: {
            id: categoryId,
            householdId,
            parentId: null,
          },

          include: {
            children: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

      if (!category) {
        res.status(404).json({
          error:
            "Main category not found",
        });

        return;
      }

      /*
       * OPTION 1:
       * Delete entire category tree.
       */
      if (
        parsed.data.mode === "category"
      ) {
        const idsToDelete = [
          category.id,

          ...category.children.map(
            (child) => child.id,
          ),
        ];

        /*
         * Expenses block deletion.
         */
        const usedCategories =
          await prisma.expense.groupBy({
            by: ["categoryId"],

            where: {
              householdId,

              categoryId: {
                in: idsToDelete,
              },
            },

            _count: {
              _all: true,
            },
          });

        if (
          usedCategories.length > 0
        ) {
          const usedIds = new Set(
            usedCategories.map(
              (item) =>
                item.categoryId,
            ),
          );

          const names: string[] = [];

          if (
            usedIds.has(category.id)
          ) {
            names.push(category.name);
          }

          for (
            const child
            of category.children
          ) {
            if (
              usedIds.has(child.id)
            ) {
              names.push(
                `${category.name} › ${child.name}`,
              );
            }
          }

          res.status(409).json({
            error:
              "Category cannot be deleted because expenses already use it.",

            usedCategories: names,
          });

          return;
        }

        await prisma.$transaction(
          async (tx) => {
            /*
             * Budgets may safely be deleted.
             */
            await tx.monthlyBudget.deleteMany({
              where: {
                householdId,

                categoryId: {
                  in: idsToDelete,
                },
              },
            });

            /*
             * Delete children before parent
             * because of the self-reference.
             */
            await tx.category.deleteMany({
              where: {
                householdId,
                parentId: category.id,
              },
            });

            await tx.category.delete({
              where: {
                id: category.id,
              },
            });
          },
        );

        res.json({
          message:
            "Category and all subcategories deleted successfully",
        });

        return;
      }

      /*
       * OPTION 2:
       * Delete selected subcategories only.
       */
      const requestedIds = [
        ...new Set(
          parsed.data.subcategoryIds,
        ),
      ];

      const actualChildren =
        category.children.filter(
          (child) =>
            requestedIds.includes(
              child.id,
            ),
        );

      /*
       * Prevent sending arbitrary category
       * IDs belonging somewhere else.
       */
      if (
        actualChildren.length !==
        requestedIds.length
      ) {
        res.status(400).json({
          error:
            "One or more selected subcategories do not belong to this category",
        });

        return;
      }

      const childIds =
        actualChildren.map(
          (child) => child.id,
        );

      /*
       * Any selected child containing
       * expenses blocks this operation.
       */
      const usedChildren =
        await prisma.expense.groupBy({
          by: ["categoryId"],

          where: {
            householdId,

            categoryId: {
              in: childIds,
            },
          },

          _count: {
            _all: true,
          },
        });

      if (usedChildren.length > 0) {
        const usedIds = new Set(
          usedChildren.map(
            (item) =>
              item.categoryId,
          ),
        );

        const names =
          actualChildren
            .filter((child) =>
              usedIds.has(child.id),
            )
            .map(
              (child) =>
                `${category.name} › ${child.name}`,
            );

        res.status(409).json({
          error:
            "One or more selected subcategories cannot be deleted because expenses already use them.",

          usedCategories: names,
        });

        return;
      }

      await prisma.$transaction(
        async (tx) => {
          await tx.monthlyBudget.deleteMany({
            where: {
              householdId,

              categoryId: {
                in: childIds,
              },
            },
          });

          await tx.category.deleteMany({
            where: {
              householdId,

              id: {
                in: childIds,
              },

              parentId:
                category.id,
            },
          });
        },
      );

      res.json({
        message:
          "Selected subcategories deleted successfully",
      });
    } catch (error) {
      console.error(
        "Category deletion failed:",
        error,
      );

      res.status(500).json({
        error:
          "Unable to delete category",
      });
    }
  },
);

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