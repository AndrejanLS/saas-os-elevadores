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

  // Converte number (ex: 26500) para formato de exibição (26/500)
  const year = Math.floor(order.number / 1000);
  const seq = order.number % 1000;
  const formattedNumber = `${year.toString().slice(-2)}/${String(seq).padStart(3, "0")}`;

  return NextResponse.json({
    order: {
      ...order,
      formattedNumber, // "26/500"
      displayNumber: formattedNumber, // alias
    }
  });
}
