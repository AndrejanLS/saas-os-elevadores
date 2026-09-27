import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/os-session";
import { elevatorSchema } from "@/lib/os-validation";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const elevators = await db.elevator.findMany({
    where: { companyId: session.companyId, ...(customerId ? { customerId } : {}) },
    orderBy: { identification: "asc" },
    include: { customer: { select: { name: true } } },
  });
  return NextResponse.json({ elevators });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role === "TECHNICIAN") return NextResponse.json({ error: "Sem permissão para cadastrar elevadores." }, { status: 403 });
  const result = elevatorSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Confira os dados do elevador." }, { status: 400 });
  const customer = await db.customer.findFirst({ where: { id: result.data.customerId, companyId: session.companyId } });
  if (!customer) return NextResponse.json({ error: "Cliente não encontrado para esta empresa." }, { status: 400 });
  const elevator = await db.elevator.create({ data: { ...result.data, companyId: session.companyId } });
  return NextResponse.json({ elevator }, { status: 201 });
}