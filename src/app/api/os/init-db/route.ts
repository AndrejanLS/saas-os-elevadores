import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Verifica secret para segurança
  let body: { secret?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const secret = body.secret;
  const expectedSecret = process.env.OS_BOOTSTRAP_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "OS_BOOTSTRAP_SECRET não configurada" }, { status: 500 });
  }
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Secret inválido" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL não configurada" }, { status: 503 });
  }

  try {
    // Roda prisma migrate deploy para criar tabelas
    const output = execSync("npx prisma migrate deploy", {
      env: { ...process.env },
      encoding: "utf-8",
      cwd: process.cwd(),
      stdio: "pipe"
    });
    return NextResponse.json({
      success: true,
      message: "Banco de dados inicializado com sucesso",
      output
    });
  } catch (error: any) {
    const msg = error.message || "Erro desconhecido";
    const stdout = error.stdout || "";
    const stderr = error.stderr || "";
    return NextResponse.json({
      error: "Falha ao inicializar banco",
      details: { msg, stdout, stderr }
    }, { status: 500 });
  }
}