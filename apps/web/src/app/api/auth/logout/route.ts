import { NextResponse } from "next/server";

import{
    isSameOrigin,
    SESSION_COOKIE,
} from "@/lib/session";

export async function POST(request: Request){
    if(!isSameOrigin(request)){
        return NextResponse.json(
            { error: "Invalid request origin" },
            { status: 403 },
        );
    }

    const response = NextResponse.json({
        message : "Signed out successfully",
    });

    response.cookies.set( SESSION_COOKIE, "", {
        httpOnly: true,
        secure:
            process.env.NODE_ENV === "production" ||
            process.env.APP_ORIGIN?.startsWith("https://") === true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return response;

}