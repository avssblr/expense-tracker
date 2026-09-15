"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

export default function MonthSelector({
  month,
}: {
  month: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeMonth(newMonth: string) {
    const params =
      new URLSearchParams(searchParams.toString());

    params.set("month", newMonth);

    router.replace(
      `${pathname}?${params.toString()}`,
    );
  }

  return (
    <label className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">
        Month
      </span>

      <input
        type="month"
        value={month}
        onChange={(event) =>
          changeMonth(event.target.value)
        }
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
      />
    </label>
  );
}