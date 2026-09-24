import { proxyMutation } from "@/lib/backend-mutation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: Request,
  context: Context,
) {
  const { id } = await context.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return Response.json(
      { error: "Invalid expense ID" },
      { status: 400 },
    );
  }

  return proxyMutation(
    request,
    `/api/expenses/${id}`,
    "PUT",
  );
}

export async function DELETE(
  request: Request,
  context: Context,
) {
  const { id } = await context.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return Response.json(
      { error: "Invalid expense ID" },
      { status: 400 },
    );
  }

  return proxyMutation(
    request,
    `/api/expenses/${id}`,
    "DELETE",
  );
}