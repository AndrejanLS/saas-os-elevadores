import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken } from "@/lib/os-auth";
import { SESSION_COOKIE } from "@/lib/os-session";

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(160),
  password: z.string().min(1).max(200),
});

export const runtime = "nodejs";

// BYPASS DE EMERGÊNCIA - Credenciais fixas para destravar acesso na Hostinger
const EMERGENCY_CREDENTIALS = {
  username: "andrejan",
  email: "andrejan@smartintech.com",
  password: "73710000",
  companyId: "company-andrejan",
  userId: "user-andrejan",
  name: "Andre Jan",
};

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

function createTokenWithFixedData() {
  // Cria o payload EXATO para o JWT com dados fixos do bypass
  return createSessionToken({
    userId: EMERGENCY_CREDENTIALS.userId,
    companyId: EMERGENCY_CREDENTIALS.companyId,
    role: "ADMIN",
    name: EMERGENCY_CREDENTIALS.name,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const input = loginSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json({ error: "Informe usuário/e-mail e senha válidos." }, { status: 400 });
  }

  // Normaliza e-mail/usuário (trim + minúsculas)
  const identifier = input.data.identifier.toLowerCase().trim();
  const password = input.data.password;

  // ========================================================================
  // BYPASS DE EMERGÊNCIA - PRIORIDADE 1: Verifica credenciais fixas ANTES do DB
  // ========================================================================
  const isEmergencyUser =
    (identifier === EMERGENCY_CREDENTIALS.username ||
      identifier === EMERGENCY_CREDENTIALS.email) &&
    password === EMERGENCY_CREDENTIALS.password;

  if (isEmergencyUser) {
    console.log("[LOGIN] Bypass de emergência acionado para:", identifier);
    try {
      const token = await createTokenWithFixedData();
      const response = NextResponse.json(
        {
          success: true,
          user: {
            name: EMERGENCY_CREDENTIALS.name,
            email: EMERGENCY_CREDENTIALS.email,
          },
          redirectTo: "/os",
          note: "Login via bypass de emergência",
        },
        { status: 200 }
      );

      const opts = getCookieOptions(request);
      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: opts.secure,
        sameSite: opts.sameSite,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    } catch (err) {
      console.error("[LOGIN] Erro ao criar token no bypass:", err);
      return NextResponse.json(
        {
          error: "Erro interno ao criar sessão",
          debug: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
      );
    }
  }

  // ========================================================================
  // Fluxo normal - tenta buscar no banco de dados
  // ========================================================================

  // Verificação de ambiente
  if (!process.env.DATABASE_URL) {
    console.error("[LOGIN] DATABASE_URL não configurada");
    return NextResponse.json(
      {
        error: "Configuração de banco de dados ausente.",
        debug: "DATABASE_URL não definida",
      },
      { status: 503 }
    );
  }
  if (!process.env.AUTH_SECRET) {
    console.error("[LOGIN] AUTH_SECRET não configurada");
    return NextResponse.json(
      {
        error: "Configuração de autenticação ausente.",
        debug: "AUTH_SECRET não definida",
      },
      { status: 503 }
    );
  }

  try {
    // Busca por email OU username (case-insensitive)
    const user = await db.user.findFirst({
      where: {
        active: true,
        OR: [
          { email: identifier },
          { name: identifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não encontrado ou inativo.",
          debug: `Nenhum usuário ativo encontrado para "${identifier}"`,
        },
        { status: 401 }
      );
    }

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        {
          error: "Senha incorreta.",
          debug: "Hash de senha não coincide",
        },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: "/os",
    });
    const opts = getCookieOptions(request);

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("[LOGIN] Erro interno no DB:", error);
    const message = error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json(
      {
        error: "Falha na autenticação. Tente novamente.",
        debug: message,
      },
      { status: 500 }
    );
  }
}
