import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken } from "@/lib/os-auth";
import { SESSION_COOKIE } from "@/lib/os-session";

const loginSchema = z.object({
  email: z.string().trim().min(1).max(160), // aceita "andrejan" sem @
  password: z.string().min(1).max(200),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const input = loginSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ error: "Informe e-mail e senha válidos." }, { status: 400 });

  const user = await db.user.findFirst({
    where: { email: input.data.email.toLowerCase(), active: true },
  });
  if (!user || !(await bcrypt.compare(input.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    name: user.name,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ success: true, redirectTo: "/os" });
}