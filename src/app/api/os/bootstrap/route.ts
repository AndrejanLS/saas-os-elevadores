import { NextResponse } from "next/server";
import { db, bootstrapCompany, isDbAvailable } from "@/lib/db";

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
    // Valida secret do body
    const body = await request.json();
    const secret = body.secret;
    const expectedSecret = process.env.OS_BOOTSTRAP_SECRET;
    
    if (!expectedSecret) {
      return NextResponse.json({ 
        error: "OS_BOOTSTRAP_SECRET não configurada no servidor" 
      }, { status: 500 });
    }
    
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "Secret inválido" }, { status: 401 });
    }

    const { company, user } = await bootstrapCompany();
    if (!user) {
      return NextResponse.json({ 
        message: "Bootstrap já foi executado anteriormente",
        company: { id: company.id, tradeName: company.tradeName }
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: true,
      company: { id: company.id, tradeName: company.tradeName },
      user: { id: user.id, name: user.name, email: user.email },
      credentials: { email: "admin@elevadoresdemo.com.br", password: "123456" },
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ 
      error: "Erro ao criar bootstrap", 
      details: message 
    }, { status: 500 });
  }
}
