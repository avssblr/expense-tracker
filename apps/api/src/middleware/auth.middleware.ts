import type{
    NextFunction,
    Request,
    Response,
} from "express";

import{
    verifyAccessToken,
} from "../lib/auth.js";

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
){
    const authorization = 
    req.header("authorization");

    if (
    !authorization ||
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const token=
  authorization.slice(
    "Bearer ".length,
  );

  try{
    req.auth=await verifyAccessToken(token);

    next();

  }catch {
    return res.status(401).json({
      error:
        "Invalid or expired authentication token",
    });
  }
}