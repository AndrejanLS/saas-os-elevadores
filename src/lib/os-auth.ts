import { SignJWT, jwtVerify } from "jose";

export type Session = {
  userId: string;
  companyId: string;
  role: "ADMIN" | "SUPERVISOR" | "TECHNICIAN";
  name: string;
};

const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET não configurado.");
  return new TextEncoder().encode(value);
};

export async function createSessionToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.userId || !payload.companyId || !payload.role || !payload.name) return null;
    return {
      userId: String(payload.userId),
      companyId: String(payload.companyId),
      role: payload.role as Session["role"],
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}