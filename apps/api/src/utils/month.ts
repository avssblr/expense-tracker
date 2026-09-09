export function parseMonth(month: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);

  if (!match) {
    throw new Error("Month must be in YYYY-MM format");
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);

  const start = new Date(
    Date.UTC(year, monthNumber - 1, 1),
  );

  const end = new Date(
    Date.UTC(year, monthNumber, 1),
  );

  return {
    year,
    monthNumber,
    start,
    end,
  };
}