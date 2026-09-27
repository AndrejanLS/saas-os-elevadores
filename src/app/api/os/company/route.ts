import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/os-session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const company = await db.company.findUnique({ where: { id: session.companyId } });
  if (!company) return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  return NextResponse.json({ company });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Apenas administradores podem editar a empresa." }, { status: 403 });

  const data = await request.json().catch(() => null);
  if (!data) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // Transform data to handle empty strings and nulls
  const companyData: any = {
    legalName: data.legalName || "",
    tradeName: data.tradeName || null,
    taxId: data.taxId || null,
    address: data.address || null,
    number: data.number || null,
    complement: data.complement || null,
    neighborhood: data.neighborhood || null,
    city: data.city || null,
    state: data.state || null,
    postalCode: data.postalCode || null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    website: data.website || null,
    logoObjectKey: data.logoObjectKey || null,
  };

  // Only validate required field
  if (!companyData.legalName || companyData.legalName.trim().length < 2) {
    return NextResponse.json({ error: "Razão Social é obrigatória e deve ter pelo menos 2 caracteres." }, { status: 400 });
  }

  // Allow any email format or empty - just validate it's not null if provided
  // Remove strict email validation to accept various formats

  const company = await db.company.update({
    where: { id: session.companyId },
    data: companyData
  });
  return NextResponse.json({ company });
}