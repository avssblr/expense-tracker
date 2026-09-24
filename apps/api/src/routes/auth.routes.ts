import {
  compare,
} from "bcryptjs";

import {
  Router,
} from "express";

import {
  createAccessToken,
} from "../lib/auth.js";

import {
  prisma,
} from "../lib/prisma.js";

import {
  loginSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.post(
  "/login",
  async (req, res) => {
    try {
      const result =
        loginSchema.safeParse(
          req.body,
        );

      if (!result.success) {
        return res.status(400).json({
          error:
            "Invalid login request",
        });
      }

      const {
        email,
        password,
      } = result.data;

      const user =
        await prisma.user.findUnique({
          where: {
            email,
          },

          include: {
            memberships: {
              include: {
                household: true,
              },

              orderBy: {
                id: "asc",
              },

              take: 1,
            },
          },
        });

      if (
        !user ||
        !user.passwordHash
      ) {
        return res.status(401).json({
          error:
            "Invalid email or password",
        });
      }

      const passwordMatches =
        await compare(
          password,
          user.passwordHash,
        );

      if (!passwordMatches) {
        return res.status(401).json({
          error:
            "Invalid email or password",
        });
      }

      const membership =
        user.memberships[0];

      if (!membership) {
        return res.status(403).json({
          error:
            "User does not belong to a household",
        });
      }

      const token =
        await createAccessToken({
          userId: user.id,

          householdId:
            membership.householdId,

          role:
            membership.role,
        });

      return res.json({
        token,

        user: {
          id: user.id,
          email: user.email,
          displayName:
            user.displayName,
        },

        household: {
          id:
            membership.household.id,

          name:
            membership.household.name,

          role:
            membership.role,
        },
      });
    } catch (error) {
      console.error(
        "Login failed:",
        error,
      );

      return res.status(500).json({
        error: "Unable to log in",
      });
    }
  },
);

export default router;