import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/os-session";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await context.params;

  const order = await db.serviceOrder.findFirst({
    where: { id, companyId: session.companyId },
    include: {
      company: true,
      customer: true,
      elevator: true,
      technician: { select: { name: true } },
      records: { orderBy: { createdAt: "asc" }, include: { photos: true } },
      signature: true,
    },
  });

  if (!order) return NextResponse.json({ error: "OS não encontrada." }, { status: 404 });

  return NextResponse.json({ order });
}
