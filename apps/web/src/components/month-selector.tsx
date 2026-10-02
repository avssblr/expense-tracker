"use client";

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Props = {
  month: string;
};

export default function MonthSelector({
  month,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const match = /^(\d{4})-(\d{2})$/.exec(month);

  const selectedYear = match
    ? Number(match[1])
    : new Date().getFullYear();

  const selectedMonth = match
    ? Number(match[2])
    : new Date().getMonth() + 1;

  function navigateToMonth(
    year: number,
    monthNumber: number,
  ) {
    if (
      !Number.isInteger(year) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return;
    }

    const monthValue =
      `${year}-${String(monthNumber).padStart(2, "0")}`;

    const params = new URLSearchParams(
      searchParams.toString(),
    );

    params.set("month", monthValue);

    router.push(`/?${params.toString()}`);
  }

  function previousMonth() {
    if (selectedMonth === 1) {
      navigateToMonth(selectedYear - 1, 12);
      return;
    }

    navigateToMonth(
      selectedYear,
      selectedMonth - 1,
    );
  }

  function nextMonth() {
    if (selectedMonth === 12) {
      navigateToMonth(selectedYear + 1, 1);
      return;
    }

    navigateToMonth(
      selectedYear,
      selectedMonth + 1,
    );
  }

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: 12 },
    (_, index) => currentYear - 8 + index,
  );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={previousMonth}
        aria-label="Previous month"
        title="Previous month"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600"
      >
        <ChevronLeft
          size={18}
          aria-hidden="true"
        />
      </button>

      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
        <CalendarDays
          size={18}
          className="hidden text-indigo-500 sm:block"
          aria-hidden="true"
        />

        <select
          aria-label="Select month"
          value={selectedMonth}
          onChange={(event) =>
            navigateToMonth(
              selectedYear,
              Number(event.target.value),
            )
          }
          className="cursor-pointer bg-transparent text-sm font-medium text-gray-700 outline-none"
        >
          {MONTHS.map((name, index) => (
            <option
              key={name}
              value={index + 1}
            >
              {name}
            </option>
          ))}
        </select>

        <select
          aria-label="Select year"
          value={selectedYear}
          onChange={(event) =>
            navigateToMonth(
              Number(event.target.value),
              selectedMonth,
            )
          }
          className="cursor-pointer bg-transparent text-sm font-medium text-gray-700 outline-none"
        >
          {years.map((year) => (
            <option
              key={year}
              value={year}
            >
              {year}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={nextMonth}
        aria-label="Next month"
        title="Next month"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600"
      >
        <ChevronRight
          size={18}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}