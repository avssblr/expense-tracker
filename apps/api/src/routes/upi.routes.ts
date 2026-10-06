import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { getRequestContext } from "../lib/request-contex.js";
import { requireOwner } from "../middleware/owner.middleware.js";
import { getMonthFinance } from "../services/month-finance.service.js";
import { moneyToCents } from "../utils/money.js";
import { parseMonth } from "../utils/month.js";

const router = Router();

function rupeesToPaise(
  value: unknown,
): bigint | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  if (
    !/^\d+(\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    return null;
  }

  const [
    rupeesPart = "0",
    paisePart = "",
  ] = normalized.split(".");

  try {
    return (
      BigInt(rupeesPart) *
        100n +
      BigInt(
        paisePart.padEnd(
          2,
          "0",
        ),
      )
    );
  } catch {
    return null;
  }
}

function paiseToRupees(
  paise: bigint,
): string {
  const negative =
    paise < 0n;

  const absolute =
    negative
      ? -paise
      : paise;

  const rupees =
    absolute / 100n;

  const remainder =
    absolute % 100n;

  const result =
    `${rupees}.${remainder
      .toString()
      .padStart(2, "0")}`;

  return negative
    ? `-${result}`
    : result;
}

function validateMonth(
  value: unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(
      value,
    )
  );
}

async function getTransferSummary(
  householdId: number,
  month: string,
) {
  const finance =
    await getMonthFinance(
      householdId,
      month,
    );

  const monthDate =
    parseMonth(month).start;

  const aggregate =
    await prisma
      .carryForwardTransfer
      .aggregate({
        where: {
          householdId,
          month: monthDate,
        },

        _sum: {
          amount: true,
        },
      });

  const transferredCents =
    aggregate._sum.amount
      ? moneyToCents(
          aggregate._sum
            .amount,
        )
      : 0n;

  const rawRemaining =
    finance
      .carryForwardCents -
    transferredCents;

  const remainingCents =
    rawRemaining > 0n
      ? rawRemaining
      : 0n;

  return {
    carryForwardCents:
      finance
        .carryForwardCents,

    transferredCents,

    remainingCents,
  };
}

/*
 * Get confirmed transfer summary.
 *
 * POST is used here because the
 * existing Next.js BFF already has a
 * common authenticated mutation proxy.
 */
router.post(
  "/carry-forward/summary",
  requireOwner,
  async (req, res) => {
    try {
      const {
        householdId,
      } =
        getRequestContext(
          req,
        );

      const { month } =
        req.body ?? {};

      if (
        !validateMonth(
          month,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Month must be in YYYY-MM format",
          });
      }

      const summary =
        await getTransferSummary(
          householdId,
          month,
        );

      const payeeName =
        process.env
          .MANOJA_UPI_NAME
          ?.trim() ||
        "Manoja";

      return res.json({
        month,

        payeeName,

        carryForward:
          paiseToRupees(
            summary
              .carryForwardCents,
          ),

        transferred:
          paiseToRupees(
            summary
              .transferredCents,
          ),

        remainingToTransfer:
          paiseToRupees(
            summary
              .remainingCents,
          ),
      });
    } catch (error) {
      console.error(
        "UPI transfer summary failed:",
        error,
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to retrieve transfer summary",
        });
    }
  },
);

/*
 * Generate UPI QR/deep-link.
 */
router.post(
  "/carry-forward",
  requireOwner,
  async (req, res) => {
    try {
      const {
        householdId,
      } =
        getRequestContext(
          req,
        );

      const {
        month,
        amount,
      } = req.body ?? {};

      if (
        !validateMonth(
          month,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Month must be in YYYY-MM format",
          });
      }

      const requestedPaise =
        rupeesToPaise(
          amount,
        );

      if (
        requestedPaise ===
          null ||
        requestedPaise <= 0n
      ) {
        return res
          .status(400)
          .json({
            error:
              "Transfer amount must be greater than zero",
          });
      }

      /*
       * This accounts for transfers
       * already confirmed by the user.
       */
      const summary =
        await getTransferSummary(
          householdId,
          month,
        );

      if (
        summary
          .carryForwardCents <=
        0n
      ) {
        return res
          .status(400)
          .json({
            error:
              "There is no carry-forward available for this month",
          });
      }

      if (
        summary
          .remainingCents <=
        0n
      ) {
        return res
          .status(400)
          .json({
            error:
              "The full carry-forward has already been transferred",
          });
      }

      if (
        requestedPaise >
        summary
          .remainingCents
      ) {
        return res
          .status(400)
          .json({
            error:
              "Transfer amount cannot exceed the remaining amount",

            remainingToTransfer:
              paiseToRupees(
                summary
                  .remainingCents,
              ),
          });
      }

      const upiId =
        process.env
          .MANOJA_UPI_ID
          ?.trim();

      const payeeName =
        process.env
          .MANOJA_UPI_NAME
          ?.trim() ||
        "Manoja";

      if (!upiId) {
        console.error(
          "MANOJA_UPI_ID is not configured",
        );

        return res
          .status(500)
          .json({
            error:
              "UPI payment destination is not configured",
          });
      }

      if (
        !upiId.includes(
          "@",
        ) ||
        /\s/.test(upiId)
      ) {
        console.error(
          "MANOJA_UPI_ID has an invalid format",
        );

        return res
          .status(500)
          .json({
            error:
              "UPI payment destination is invalid",
          });
      }

      const amountRupees =
        paiseToRupees(
          requestedPaise,
        );

      const params =
        new URLSearchParams({
          pa: upiId,
          pn: payeeName,
          am: amountRupees,
          cu: "INR",
          tn: `Carry Forward ${month}`,
        });

      const upiUri =
        `upi://pay?${params.toString()}`;

      return res.json({
        month,
        payeeName,

        amount:
          amountRupees,

        carryForward:
          paiseToRupees(
            summary
              .carryForwardCents,
          ),

        transferred:
          paiseToRupees(
            summary
              .transferredCents,
          ),

        remainingToTransfer:
          paiseToRupees(
            summary
              .remainingCents,
          ),

        upiUri,
      });
    } catch (error) {
      console.error(
        "UPI carry-forward generation failed:",
        error,
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to generate UPI payment",
        });
    }
  },
);

/*
 * User confirms that the payment
 * actually succeeded.
 *
 * Only this endpoint creates a
 * carry_forward_transfers row.
 */
router.post(
  "/carry-forward/confirm",
  requireOwner,
  async (req, res) => {
    try {
      const {
        householdId,
      } =
        getRequestContext(
          req,
        );

      const {
        month,
        amount,
      } = req.body ?? {};

      if (
        !validateMonth(
          month,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Month must be in YYYY-MM format",
          });
      }

      const confirmedPaise =
        rupeesToPaise(
          amount,
        );

      if (
        confirmedPaise ===
          null ||
        confirmedPaise <= 0n
      ) {
        return res
          .status(400)
          .json({
            error:
              "Transfer amount must be greater than zero",
          });
      }

      const summary =
        await getTransferSummary(
          householdId,
          month,
        );

      if (
        confirmedPaise >
        summary
          .remainingCents
      ) {
        return res
          .status(400)
          .json({
            error:
              "Confirmed amount exceeds the remaining carry-forward amount",
          });
      }

      const monthDate =
        parseMonth(
          month,
        ).start;

      await prisma
        .carryForwardTransfer
        .create({
          data: {
            householdId,
            month: monthDate,

            amount:
              paiseToRupees(
                confirmedPaise,
              ),
          },
        });

      const updated =
        await getTransferSummary(
          householdId,
          month,
        );

      const payeeName =
        process.env
          .MANOJA_UPI_NAME
          ?.trim() ||
        "Manoja";

      return res.json({
        message:
          `${paiseToRupees(
            confirmedPaise,
          )} transferred to ${payeeName}`,

        month,
        payeeName,

        confirmedAmount:
          paiseToRupees(
            confirmedPaise,
          ),

        carryForward:
          paiseToRupees(
            updated
              .carryForwardCents,
          ),

        transferred:
          paiseToRupees(
            updated
              .transferredCents,
          ),

        remainingToTransfer:
          paiseToRupees(
            updated
              .remainingCents,
          ),
      });
    } catch (error) {
      console.error(
        "UPI transfer confirmation failed:",
        error,
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to confirm transfer",
        });
    }
  },
);

export default router;