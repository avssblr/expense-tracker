import { NextResponse } from "next/server";

import {
  isSameOrigin,
  SESSION_COOKIE,
} from "@/lib/session";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:4000";

const SESSION_DURATION = 12 * 60 * 60; // 12 hours

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }

  let credentials: unknown;

  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${API_BASE_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        cache: "no-store",
      },
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error: data.error ?? "Unable to sign in",
        },
        { status: backendResponse.status },
      );
    }

    if (typeof data.token !== "string" || !data.token) {
      return NextResponse.json(
        { error: "Invalid authentication response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({
      user: data.user,
      household: data.household,
    });

    response.cookies.set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" ||
        process.env.APP_ORIGIN?.startsWith("https://") === true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION,
    });

    return response;
  } catch (error) {
    console.error("Login proxy failed:", error);

    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 502 },
    );
  }
}