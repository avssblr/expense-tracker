import "dotenv/config"

import {
    jwtVerify,
    SignJWT,
} from "jose"

const jwtSecret=process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is not configured",
  );
}

const secret = new TextEncoder().encode(jwtSecret,);

export type AuthContext = {
    userId: number;
    householdId: number;
    role: string;
};

export async function createAccessToken(

    auth: AuthContext,
): Promise<string>{
    return new SignJWT({
        householdId: auth.householdId,
        role: auth.role,
    })
    .setProtectedHeader({
        alg: "HS256",
    })
    .setSubject(String(auth.userId),)

    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyAccessToken(
    token: string,
): Promise<AuthContext>{
    const { payload } = 
    await jwtVerify(
        token,
        secret,
        {
            algorithms: ["HS256"],
        },
    );

    const userId=
    Number(payload.sub);

    const householdId =
    Number(payload.householdId);

  const role =
    typeof payload.role === "string"
      ? payload.role
      : "";

  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(householdId) ||
    householdId <= 0 ||
    !role
  ) {
    throw new Error(
      "Invalid authentication token",
    );
  }

  return {
    userId,
    householdId,
    role,
  };
}

