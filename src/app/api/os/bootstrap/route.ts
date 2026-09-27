import { NextResponse } from "next/server";
import { db, bootstrapCompany } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { company, user } = await bootstrapCompany();
    if (!user) {
      return NextResponse.json({ error: "Bootstrap já foi executado anteriormente." }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      company: { id: company.id, tradeName: company.tradeName },
      user: { id: user.id, name: user.name, email: user.email },
      credentials: { email: "admin@elevadoresdemo.com.br", password: "123456" },
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    return NextResponse.json({ error: "Erro ao criar bootstrap" }, { status: 500 });
  }
}