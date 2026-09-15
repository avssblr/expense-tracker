const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

const backendHeaders = {
  "Content-Type": "application/json",
  "x-household-id": "1",
  "x-user-id": "1",
};

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/expenses/${id}`,
      {
        method: "PUT",
        headers: backendHeaders,
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Expense update proxy failed:",
      error,
    );

    return Response.json(
      {
        error: "Unable to update expense",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await context.params;

    const response = await fetch(
      `${API_BASE_URL}/api/expenses/${id}`,
      {
        method: "DELETE",

        headers: {
          "x-household-id": "1",
          "x-user-id": "1",
        },
      },
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Expense delete proxy failed:",
      error,
    );

    return Response.json(
      {
        error: "Unable to delete expense",
      },
      {
        status: 500,
      },
    );
  }
}