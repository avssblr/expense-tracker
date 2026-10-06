-- CreateTable
CREATE TABLE "carry_forward_transfers" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER NOT NULL,
    "month" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carry_forward_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "carry_forward_transfers_householdId_month_idx" ON "carry_forward_transfers"("householdId", "month");
