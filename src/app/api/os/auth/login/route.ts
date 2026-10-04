import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken } from "@/lib/os-auth";
import { SESSION_COOKIE } from "@/lib/os-session";

const loginSchema = z.object({
  email: z.string().trim().min(1).max(160),
  password: z.string().min(1).max(200),
});

export const runtime = "nodejs";

type SameSiteType = "none" | "lax" | "strict";

function getCookieOptions(request: Request): { secure: boolean; sameSite: SameSiteType } {
  const isProduction = process.env.NODE_ENV === "production";
  const host = request.headers.get("host") || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const isPrivateNetwork = host.includes("192.168.") || host.includes("10.") || host.includes("172.16.");

  const secure = isProduction;
  let sameSite: SameSiteType = "lax";
  if (isProduction) sameSite = "none";
  else if (isPrivateNetwork) sameSite = "none";
  else if (isLocalhost) sameSite = "lax";

  return { secure, sameSite };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const input = loginSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ error: "Informe e-mail e senha válidos." }, { status: 400 });

  // Verificação de ambiente - retorna erro claro se configuração faltando
  if (!process.env.DATABASE_URL) {
    console.error("[LOGIN] DATABASE_URL não configurada");
    return NextResponse.json({ error: "Configuração de banco de dados ausente. Configure DATABASE_URL." }, { status: 503 });
  }
  if (!process.env.AUTH_SECRET) {
    console.error("[LOGIN] AUTH_SECRET não configurada");
    return NextResponse.json({ error: "Configuração de autenticação ausente. Configure AUTH_SECRET." }, { status: 503 });
  }

  try {
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
    const opts = getCookieOptions(request);

    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, redirectTo: "/os" });
  } catch (error) {
    console.error("[LOGIN] Erro interno:", error);
    const message = error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json({ error: "Falha na autenticação. Tente novamente." }, { status: 500 });
  }
}
