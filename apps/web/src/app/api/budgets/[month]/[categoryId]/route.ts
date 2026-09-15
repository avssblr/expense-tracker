const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      month: string;
      categoryId: string;
    }>;
  },
) {
  try {
    const {
      month,
      categoryId,
    } = await context.params;

    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${month}/${categoryId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          "x-household-id": "1",
          "x-user-id": "1",
        },

        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Budget proxy failed:",
      error,
    );

    return Response.json(
      {
        error: "Unable to save budget",
      },
      {
        status: 500,
      },
    );
  }
}