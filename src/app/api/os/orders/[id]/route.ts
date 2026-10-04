import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/os-session";
import { serviceOrderSchema } from "@/lib/os-validation";

const MAX_SIGNATURE_SIZE = 200 * 1024; // 200KB

function validateSignature(signature: string | null, responsibleName: string | null): { valid: boolean; error?: string } {
  if (!signature) return { valid: true }; // null = remoção permitida
  if (!responsibleName?.trim()) return { valid: false, error: "Nome do responsável é obrigatório para assinatura." };
  if (!signature.startsWith("data:image/png;base64,")) return { valid: false, error: "Formato de assinatura inválido. Use PNG base64." };
  const base64 = signature.split(",")[1];
  if (!base64) return { valid: false, error: "Assinatura vazia." };
  const sizeBytes = Math.ceil(base64.length * 0.75);
  if (sizeBytes > MAX_SIGNATURE_SIZE) return { valid: false, error: `Assinatura muito grande (${Math.round(sizeBytes/1024)}KB). Máximo ${MAX_SIGNATURE_SIZE/1024}KB.` };
  return { valid: true };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });

  // Verifica se a OS pertence à empresa
  const existingOrder = await db.serviceOrder.findFirst({
    where: { id, companyId: session.companyId },
    include: { signature: true },
  });

  if (!existingOrder) return NextResponse.json({ error: "OS não encontrada." }, { status: 404 });

  // Valida assinatura se enviada
  const sigValidation = validateSignature(body.signature, body.responsibleName);
  if (!sigValidation.valid) {
    return NextResponse.json({ error: sigValidation.error }, { status: 400 });
  }

  // Atualiza campos permitidos
  const updateData: any = {};
  if (body.responsibleName !== undefined) updateData.responsibleName = body.responsibleName || null;
  if (body.responsibleRole !== undefined) updateData.responsibleRole = body.responsibleRole || null;
  if (body.generalNotes !== undefined) updateData.generalNotes = body.generalNotes || null;
  if (body.servicesNotes !== undefined) updateData.servicesNotes = body.servicesNotes || null;
  if (body.findingsNotes !== undefined) updateData.findingsNotes = body.findingsNotes || null;
  if (body.situation !== undefined) updateData.situation = body.situation;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.startTime !== undefined) updateData.startTime = body.startTime ? new Date(body.startTime) : null;
  if (body.endTime !== undefined) updateData.endTime = body.endTime ? new Date(body.endTime) : null;

  // Se tem assinatura nova, atualiza/cria Signature dentro de transação
  if (body.signature && body.responsibleName) {
    await db.$transaction(async (tx) => {
      if (existingOrder.signature) {
        await tx.signature.update({
          where: { id: existingOrder.signature.id },
          data: {
            objectKey: body.signature,
            signerName: body.responsibleName,
            signerRole: body.responsibleRole || null,
          },
        });
      } else {
        await tx.signature.create({
          data: {
            companyId: session.companyId,
            serviceOrderId: id,
            objectKey: body.signature,
            signerName: body.responsibleName,
            signerRole: body.responsibleRole || null,
          },
        });
      }
    });
  }

  // Se pediu para remover assinatura
  if (body.signature === null && existingOrder.signature) {
    await db.signature.delete({ where: { id: existingOrder.signature.id } });
  }

  const order = await db.serviceOrder.update({
    where: { id },
    data: updateData,
    include: {
      company: true,
      customer: true,
      elevator: true,
      technician: { select: { name: true } },
      records: { orderBy: { createdAt: "asc" }, include: { photos: true } },
      signature: true,
    },
  });

  const year = Math.floor(order.number / 1000);
  const seq = order.number % 1000;
  const formattedNumber = `${year.toString().slice(-2)}/${String(seq).padStart(3, "0")}`;

  return NextResponse.json({
    order: {
      ...order,
      formattedNumber,
      displayNumber: formattedNumber,
    },
  });
}