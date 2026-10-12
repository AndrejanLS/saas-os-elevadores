import { NextResponse } from "next/server";
import { db, bootstrapCompany, isDbAvailable, createSchema } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return initializeDatabase();
}

// GET também permite via navegador (para facilitar first deploy no Hostinger)
export async function GET(request: Request) {
  return initializeDatabase();
}

async function initializeDatabase() {
  // Verifica se DB está disponível
  if (!isDbAvailable()) {
    return NextResponse.json({
      error: "DATABASE_URL não configurada",
      details: "Configure DATABASE_URL nas variáveis de ambiente"
    }, { status: 503 });
  }

  try {
    // Primeiro: criar tabelas via SQL raw
    await createSchema();

    // Depois: criar/ATUALIZAR empresa e usuário bootstrap
    const { company, user } = await bootstrapCompany();
    // user é null se já existia, mas senha foi atualizada via upsert
    return NextResponse.json({
      success: true,
      message: user ? "Banco inicializado e usuário criado" : "Banco já existia; senha do usuário padrão atualizada",
      company: { id: company.id, tradeName: company.tradeName },
      user: { id: user?.id || "existing", name: "Andre Jan", email: "andrejan@smartintech.com" },
    });
  } catch (error) {
    console.error("Init DB error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({
      error: "Erro ao inicializar banco",
      details: message
    }, { status: 500 });
  }
}
