import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/os-session";
import { customerSchema } from "@/lib/os-validation";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim();
  const customers = await db.customer.findMany({
    where: { companyId: session.companyId, ...(query ? { name: { contains: query } } : {}) },
    orderBy: { name: "asc" },
    include: { _count: { select: { elevators: true, serviceOrders: true } } },
  });
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role === "TECHNICIAN") return NextResponse.json({ error: "Sem permissão para cadastrar clientes." }, { status: 403 });
  const result = customerSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Confira os dados do cliente." }, { status: 400 });
  const customer = await db.customer.create({ data: { ...result.data, companyId: session.companyId } });
  return NextResponse.json({ customer }, { status: 201 });
}