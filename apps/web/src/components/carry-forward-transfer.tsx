"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  IndianRupee,
  QrCode,
  X,
} from "lucide-react";

import {
  QRCodeSVG,
} from "qrcode.react";

type CarryForwardTransferProps = {
  month: string;
  carryForward:
    | string
    | number;
};

type TransferSummary = {
  month: string;
  payeeName: string;
  carryForward: string;
  transferred: string;
  remainingToTransfer: string;
};

type UpiResponse =
  TransferSummary & {
    amount: string;
    upiUri: string;
  };

type ConfirmationResponse =
  TransferSummary & {
    message: string;
    confirmedAmount: string;
  };

function formatMoney(
  value: string | number,
) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return "₹0.00";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    },
  ).format(numeric);
}

export default function CarryForwardTransfer({
  month,
  carryForward,
}: CarryForwardTransferProps) {
  const initialCarryForward =
    useMemo(
      () =>
        Number(
          carryForward,
        ),
      [carryForward],
    );

  const [
    summary,
    setSummary,
  ] =
    useState<TransferSummary | null>(
      null,
    );

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    qrResult,
    setQrResult,
  ] =
    useState<UpiResponse | null>(
      null,
    );

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);

  const formattedMonth =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      },
    ).format(
      new Date(
        `${month}-01T00:00:00.000Z`,
      ),
    );

  const currentCarryForward =
    summary
      ? Number(
          summary
            .carryForward,
        )
      : initialCarryForward;

  const transferred =
    summary
      ? Number(
          summary.transferred,
        )
      : 0;

  const remaining =
    summary
      ? Number(
          summary
            .remainingToTransfer,
        )
      : initialCarryForward;

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const response =
          await fetch(
            "/api/upi/carry-forward/summary",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  month,
                }),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ??
              "Unable to load transfer summary.",
          );
        }

        if (active) {
          setSummary(
            data as TransferSummary,
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load transfer summary.",
          );
        }
      }
    }

    loadSummary();

    return () => {
      active = false;
    };
  }, [month]);

  function resetPayment() {
    setAmount("");
    setQrResult(null);
    setError("");
    setIsLoading(false);
    setIsConfirming(
      false,
    );
  }

  function closeDialog() {
    setIsOpen(false);
    resetPayment();
  }

  function useFullAmount() {
    setAmount(
      remaining.toFixed(2),
    );

    setQrResult(null);
    setError("");
  }

  async function generateQr() {
    setError("");
    setMessage("");
    setQrResult(null);

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter an amount greater than zero.",
      );

      return;
    }

    if (
      numericAmount >
      remaining
    ) {
      setError(
        "Amount cannot exceed the remaining amount to transfer.",
      );

      return;
    }

    setIsLoading(true);

    try {
      const response =
        await fetch(
          "/api/upi/carry-forward",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                month,
                amount,
              }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to generate UPI payment.",
        );
      }

      setQrResult(
        data as UpiResponse,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate UPI payment.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmTransfer() {
    if (!qrResult) {
      return;
    }

    setError("");
    setIsConfirming(
      true,
    );

    try {
      const response =
        await fetch(
          "/api/upi/carry-forward/confirm",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                month,

                amount:
                  qrResult.amount,
              }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to confirm transfer.",
        );
      }

      const confirmed =
        data as ConfirmationResponse;

      setSummary({
        month:
          confirmed.month,

        payeeName:
          confirmed.payeeName,

        carryForward:
          confirmed
            .carryForward,

        transferred:
          confirmed
            .transferred,

        remainingToTransfer:
          confirmed
            .remainingToTransfer,
      });

      setMessage(
        `${formatMoney(
          confirmed
            .confirmedAmount,
        )} transferred to ${confirmed.payeeName}.`,
      );

      setIsOpen(false);
      resetPayment();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm transfer.",
      );
    } finally {
      setIsConfirming(
        false,
      );
    }
  }

  function transferNotCompleted() {
    const attempted =
      qrResult?.amount;

    setIsOpen(false);
    resetPayment();

    if (attempted) {
      setMessage(
        `${formatMoney(
          attempted,
        )} was not marked as transferred.`,
      );
    }
  }

  if (
    !Number.isFinite(
      initialCarryForward,
    ) ||
    initialCarryForward <= 0
  ) {
    return null;
  }

  return (
    <>
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">

          <div>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" />

              <h2 className="text-lg font-bold text-slate-900">
                Carry-forward
                transfer
              </h2>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {formattedMonth}
            </p>
          </div>

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessage(
                  "",
                );
                setIsOpen(
                  true,
                );
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <QrCode className="h-4 w-4" />

              Transfer via UPI
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Carry Forward
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatMoney(
                currentCarryForward,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Transferred to
              Manoja
            </p>

            <p className="mt-1 text-xl font-bold text-emerald-800">
              {formatMoney(
                transferred,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Remaining to
              transfer
            </p>

            <p className="mt-1 text-xl font-bold text-indigo-800">
              {formatMoney(
                remaining,
              )}
            </p>
          </div>

        </div>

        {message && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {message}
            </span>
          </div>
        )}

        {remaining <= 0 && (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            The full carry-forward
            amount has been marked
            as transferred to Manoja.
          </div>
        )}
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">

          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Transfer via
                  UPI
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {formattedMonth}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeDialog
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">

              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Remaining to
                  transfer
                </p>

                <p className="mt-1 text-2xl font-bold text-indigo-800">
                  {formatMoney(
                    remaining,
                  )}
                </p>
              </div>

              {!qrResult && (
                <>
                  <div>
                    <label
                      htmlFor="upi-amount"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Transfer
                      amount
                    </label>

                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="upi-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={
                          remaining
                        }
                        value={
                          amount
                        }
                        onChange={(
                          event,
                        ) => {
                          setAmount(
                            event
                              .target
                              .value,
                          );

                          setError(
                            "",
                          );
                        }}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={
                        useFullAmount
                      }
                      className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Use full
                      amount
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={
                      isLoading ||
                      !amount
                    }
                    onClick={
                      generateQr
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <QrCode className="h-4 w-4" />

                    {isLoading
                      ? "Generating..."
                      : "Generate UPI QR"}
                  </button>
                </>
              )}

              {qrResult && (
                <>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Pay
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {
                        qrResult
                          .payeeName
                      }
                    </p>

                    <p className="mt-2 text-3xl font-bold text-emerald-700">
                      {formatMoney(
                        qrResult
                          .amount,
                      )}
                    </p>
                  </div>

                  <div className="flex justify-center rounded-2xl border border-gray-200 bg-white p-5">
                    <QRCodeSVG
                      value={
                        qrResult
                          .upiUri
                      }
                      size={220}
                      level="M"
                      marginSize={2}
                    />
                  </div>

                  <a
                    href={
                      qrResult
                        .upiUri
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <IndianRupee className="h-4 w-4" />
                    Pay via UPI
                  </a>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">

                    <p className="text-center text-sm font-bold text-slate-900">
                      Did you transfer{" "}
                      {formatMoney(
                        qrResult
                          .amount,
                      )}{" "}
                      to{" "}
                      {
                        qrResult
                          .payeeName
                      }
                      ?
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <button
                        type="button"
                        disabled={
                          isConfirming
                        }
                        onClick={
                          confirmTransfer
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isConfirming
                          ? "Saving..."
                          : "Yes"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          isConfirming
                        }
                        onClick={
                          transferNotCompleted
                        }
                        className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        No
                      </button>

                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}