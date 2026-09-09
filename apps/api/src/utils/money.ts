export function moneyToCents(
  value: string | number | { toString(): string },
): bigint {
  const text = value.toString().trim();

  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(text);

  if (!match) {
    throw new Error(`Invalid money value: ${text}`);
  }

  const negative = match[1] === "-";
  const whole = BigInt(match[2] ?? "");
  const fraction = BigInt(
    (match[3] ?? "").padEnd(2, "0"),
  );

  const cents = whole * 100n + fraction;

  return negative ? -cents : cents;
}

export function centsToMoney(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;

  const whole = absolute / 100n;
  const fraction = absolute % 100n;

  return `${negative ? "-" : ""}${whole}.${fraction
    .toString()
    .padStart(2, "0")}`;
}

export function percent(
  used: bigint,
  total: bigint,
): number | null {
  if (total <= 0n) {
    return null;
  }

  // hundredths of one percent
  const hundredths =
    (used * 10000n + total / 2n) / total;

  return Number(hundredths) / 100;
}