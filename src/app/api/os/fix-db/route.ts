import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { secret?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const secret = body.secret;
  const expectedSecret = process.env.OS_BOOTSTRAP_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL não configurada" }, { status: 503 });
  }

  try {
    // Força migrate deploy (sem skip) - válido para prisma 6.19.3
    const execOut = execSync("npx prisma migrate deploy", {
      env: { ...process.env },
      encoding: "utf-8",
      stdio: "pipe"
    });

    return NextResponse.json({ ok: true, message: "Database initialized", output: execOut });
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
