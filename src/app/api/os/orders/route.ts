import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/os-session";
import { serviceOrderSchema } from "@/lib/os-validation";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const status = params.get("status") as "DRAFT" | "COMPLETED" | "CANCELLED" | null;
  const customerId = params.get("customerId");
  const elevatorId = params.get("elevatorId");
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");

  const where: any = { companyId: session.companyId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (elevatorId) where.elevatorId = elevatorId;
  if (dateFrom || dateTo) {
    where.openedAt = {};
    if (dateFrom) where.openedAt.gte = new Date(dateFrom);
    if (dateTo) where.openedAt.lte = new Date(dateTo);
  }

  const orders = await db.serviceOrder.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true } },
      elevator: { select: { identification: true } },
      technician: { select: { name: true } },
      _count: { select: { records: true, photos: true } },
    },
  });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const result = serviceOrderSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) {
    console.error("Validation error:", result.error);
    return NextResponse.json({ error: "Inclua pelo menos um registro e confira os dados." }, { status: 400 });
  }

  // Handle elevator - either existing ID or new identification
  let elevatorId: string;
  if (result.data.elevatorId) {
    const elevator = await db.elevator.findFirst({
      where: { id: result.data.elevatorId, companyId: session.companyId, customerId: result.data.customerId },
      select: { id: true }
    });
    if (!elevator) return NextResponse.json({ error: "Elevador inválido para esta empresa." }, { status: 400 });
    elevatorId = elevator.id;
  } else if (result.data.elevatorIdentification) {
    // Create new elevator on the fly
    const newElevator = await db.elevator.create({
      data: {
        identification: result.data.elevatorIdentification,
        customerId: result.data.customerId,
        companyId: session.companyId,
      },
    });
    elevatorId = newElevator.id;
  } else {
    return NextResponse.json({ error: "É necessário selecionar ou informar um elevador." }, { status: 400 });
  }

  // Verify customer exists
  const customer = await db.customer.findFirst({
    where: { id: result.data.customerId, companyId: session.companyId },
    select: { id: true }
  });
  if (!customer) return NextResponse.json({ error: "Cliente inválido para esta empresa." }, { status: 400 });

  const order = await db.$transaction(async (tx) => {
    const last = await tx.serviceOrder.findFirst({ where: { companyId: session.companyId }, orderBy: { number: "desc" }, select: { number: true } });

    // Gera número no formato AA/NNNN (56/AAAA)
    // Ano atual (último dígito de 20XX) + / + próximo número sequencial
    const currentYear = new Date().getFullYear().toString().slice(-2); // ex: 26
    const yearPrefix = parseInt(currentYear, 10);
    const lastYear = last?.number ? Math.floor(last.number / 10000) : 0;
    let nextSequence = 500; // começa em 500, depois 531, 562...

    // Se já existem ordens neste ano, continua a sequência
    if (last?.number && lastYear > 0 && lastYear.toString().slice(-2) === currentYear) {
      const year = Math.floor(last.number / 100);
      const seq = last.number % 100;
      // Incrementa a sequência de 31 em 31 (500 + 31 = 531, 531 + 31 = 562)
      nextSequence = ((seq + 31) % 10000) || 500;
    }

    const nextNumber = yearPrefix * 100 + nextSequence;

    // Create photos if any records have them
    const recordsWithPhotos = result.data.records.filter(r => r.photos && r.photos.length > 0);

    return tx.serviceOrder.create({
      data: {
        companyId: session.companyId,
        number: nextNumber,
        customerId: customer.id,
        elevatorId: elevatorId,
        technicianId: session.userId,
        situation: result.data.situation,
        startTime: result.data.startTime ? new Date(result.data.startTime) : null,
        endTime: result.data.endTime ? new Date(result.data.endTime) : null,
        responsibleName: result.data.responsibleName || null,
        responsibleRole: result.data.responsibleRole || null,
        generalNotes: result.data.generalNotes || null,
        servicesNotes: result.data.servicesNotes || null,
        findingsNotes: result.data.findingsNotes || null,
        records: {
          create: result.data.records.map((record) => ({
            companyId: session.companyId,
            authorId: session.userId,
            part: record.part,
            customPart: record.customPart || null,
            notes: record.notes,
            photos: record.photos && record.photos.length > 0 ? {
              create: record.photos.map((photoData) => ({
                companyId: session.companyId,
                serviceOrderId: undefined as any, // Will be set by relation
                uploadedById: session.userId,
                objectKey: photoData,
                mimeType: "image/jpeg",
                sizeBytes: photoData.length,
                caption: record.customPart || record.part,
              })),
            } : undefined,
          })),
        },
      },
      include: { records: { include: { photos: true } } },
    });
  });
  return NextResponse.json({ order }, { status: 201 });
}
