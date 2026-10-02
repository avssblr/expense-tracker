import { proxyMutation } from "@/lib/backend-mutation";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      month: string;
    }>;
  },
) {
  const { month } =
    await context.params;

  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      month,
    )
  ) {
    return Response.json(
      {
        error: "Invalid month",
      },
      {
        status: 400,
      },
    );
  }

  return proxyMutation(
    request,
    `/api/budgets/${month}/copy-previous`,
    "POST",
  );
}