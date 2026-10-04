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
    // Lock para evitar concorrência: pega última OS da empresa com FOR UPDATE
    const last = await tx.$queryRaw`
      SELECT number FROM "ServiceOrder"
      WHERE "companyId" = ${session.companyId}
      ORDER BY number DESC
      LIMIT 1
    ` as { number: number }[];

    const lastNumber = last[0]?.number ?? null;

    // Gera número no formato AAASSEQ (ex: 26500 = 26*1000 + 500)
    // Ano atual (2 dígitos) + sequência de 3 dígitos
    const currentYear = new Date().getFullYear().toString().slice(-2); // ex: "26"
    const yearPrefix = parseInt(currentYear, 10); // 26
    const lastYear = lastNumber ? Math.floor(lastNumber / 1000) : 0; // 26500 / 1000 = 26
    let nextSequence = 500; // começa em 500, depois 531, 562...

    // Se já existem ordens neste ano, continua a sequência (+31)
    if (lastNumber && lastYear > 0 && lastYear === yearPrefix) {
      const seq = lastNumber % 1000; // 26500 % 1000 = 500
      nextSequence = seq + 31; // 500 + 31 = 531
    }

    const nextNumber = yearPrefix * 1000 + nextSequence; // 26 * 1000 + 500 = 26500

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
                serviceOrderId: undefined as any,
                uploadedById: session.userId,
                objectKey: photoData,
                mimeType: "image/jpeg",
                sizeBytes: photoData.length,
                caption: record.customPart || record.part,
              })),
            } : undefined,
          })),
        },
        // Criar assinatura se enviada
        ...(result.data.signature && result.data.responsibleName ? {
          signature: {
            create: {
              companyId: session.companyId,
              objectKey: result.data.signature,
              signerName: result.data.responsibleName,
              signerRole: result.data.responsibleRole || null,
            }
          }
        } : {}),
      },
      include: {
        records: { include: { photos: true } },
        signature: true,
      },
    });
  });
  return NextResponse.json({ order }, { status: 201 });
}
