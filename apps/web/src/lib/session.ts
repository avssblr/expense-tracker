import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "expense_session";

export async function getSessionToken(): Promise<string | null>{
    const cookieStore = await cookies();

    return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

//Restricted to app/browser-origin
export function isSameOrigin(request: Request): boolean{
    const origin = request.headers.get("origin");

    const expectedOrigin = process.env.APP_ORIGIN ?? new URL(request.url).origin;

    return origin === expectedOrigin;
}

