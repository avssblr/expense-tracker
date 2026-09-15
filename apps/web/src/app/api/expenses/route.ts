const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/expenses`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          // Temporary development identity.
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
    console.error("Expense proxy failed:", error);

    return Response.json(
      {
        error: "Unable to create expense",
      },
      {
        status: 500,
      },
    );
  }
}