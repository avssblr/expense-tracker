import "server-only";

import {
  getSessionToken,
  isSameOrigin,
} from "@/lib/session";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:4000";

type MutationMethod = "POST" | "PUT" | "DELETE";

export async function proxyMutation(
  request: Request,
  path: string,
  method: MutationMethod,
): Promise<Response> {
  if (!isSameOrigin(request)) {
    return Response.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }

  const token = await getSessionToken();

  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let body: string | undefined;

  if (method !== "DELETE") {
    try {
      body = JSON.stringify(await request.json());
    } catch {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body,
        cache: "no-store",
      },
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Backend mutation failed:", error);

    return Response.json(
      { error: "Unable to contact the backend" },
      { status: 502 },
    );
  }
}