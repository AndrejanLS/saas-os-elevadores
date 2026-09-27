import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/os-session";
import { elevatorSchema } from "@/lib/os-validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const elevator = await db.elevator.findFirst({
    where: { id, companyId: session.companyId },
    include: { customer: { select: { name: true } } },
  });
  if (!elevator) return NextResponse.json({ error: "Elevador não encontrado." }, { status: 404 });
  return NextResponse.json({ elevator });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role === "TECHNICIAN") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { id } = await params;
  const result = elevatorSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Confira os dados do elevador." }, { status: 400 });
  const elevator = await db.elevator.update({
    where: { id, companyId: session.companyId },
    data: result.data,
  });
  return NextResponse.json({ elevator });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role === "TECHNICIAN") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { id } = await params;
  await db.elevator.delete({ where: { id, companyId: session.companyId } });
  return NextResponse.json({ success: true });
}