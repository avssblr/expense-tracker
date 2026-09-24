import { proxyMutation } from "@/lib/backend-mutation";

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      month: string;
      categoryId: string;
    }>;
  },
) {
  const { month, categoryId } = await context.params;

  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    !/^[1-9]\d*$/.test(categoryId)
  ) {
    return Response.json(
      { error: "Invalid month or category ID" },
      { status: 400 },
    );
  }

  return proxyMutation(
    request,
    `/api/budgets/${month}/${categoryId}`,
    "PUT",
  );
}