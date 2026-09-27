import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/os-session";
import { customerSchema } from "@/lib/os-validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const customer = await db.customer.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!customer) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({ customer });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role === "TECHNICIAN") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { id } = await params;
  const result = customerSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Confira os dados do cliente." }, { status: 400 });
  const customer = await db.customer.update({
    where: { id, companyId: session.companyId },
    data: result.data,
  });
  return NextResponse.json({ customer });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role === "TECHNICIAN") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { id } = await params;
  await db.customer.delete({ where: { id, companyId: session.companyId } });
  return NextResponse.json({ success: true });
}