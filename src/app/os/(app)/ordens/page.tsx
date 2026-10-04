import Link from "next/link";
import { requireSession } from "@/lib/os-session";
import { db } from "@/lib/db";
import OrdersPageClient from "./page-client";

export default async function OrdersPage() {
  const session = await requireSession();
  const rawOrders = await db.serviceOrder.findMany({
    where: { companyId: session.companyId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true } },
      elevator: { select: { identification: true } },
      technician: { select: { name: true } },
      _count: { select: { records: true, photos: true } },
    },
  });

  const orders = rawOrders.map((o: any) => ({
    id: o.id,
    number: o.number,
    status: o.status as string,
    openedAt: o.openedAt.toISOString(),
    customer: { name: o.customer.name },
    elevator: { identification: o.elevator.identification },
    technician: { name: o.technician.name },
    _count: { records: o._count.records, photos: o._count.photos },
  }));

  const customers = [...new Set(rawOrders.map((o: any) => o.customer.name))].sort() as string[];

  return <OrdersPageClient orders={orders} customers={customers} />;
}