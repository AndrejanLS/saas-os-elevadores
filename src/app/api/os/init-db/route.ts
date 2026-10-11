import { NextResponse } from "next/server";
import { db, bootstrapCompany, isDbAvailable, createSchema } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

    // Depois: criar empresa e usuário bootstrap
    const { company, user } = await bootstrapCompany();
    if (!user) {
      return NextResponse.json({
        message: "Banco já foi inicializado anteriormente",
        company: { id: company.id, tradeName: company.tradeName }
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      message: "Banco inicializado e usuário criado com sucesso",
      company: { id: company.id, tradeName: company.tradeName },
      user: { id: user.id, name: user.name, email: user.email },
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
