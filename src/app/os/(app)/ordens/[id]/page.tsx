import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/os-session";
import { Eye, Download, Clock, CheckCircle2, AlertCircle, Printer, Building2, MapPin, Building, Cpu, Settings, Wrench, FileText } from "lucide-react";
import { PdfButton } from "./pdf-button";
import { situationLabel } from "@/lib/generate-order-pdf";

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  DRAFT: { bg: "bg-amber-50", text: "text-amber-700", label: "Rascunho", icon: <Clock className="h-3 w-3" /> },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Concluída", icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", label: "Cancelada", icon: <AlertCircle className="h-3 w-3" /> },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

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

  if (!order) notFound();

  // Calcula formattedNumber para exibição
  const year = Math.floor(order.number / 1000) || 0;
  const seq = order.number % 1000 || 0;
  const formattedNumber = year > 0 ? `${year.toString().slice(-2)}/${String(seq).padStart(3, "0")}` : "—";
  const signatureBase64 = order.signature?.objectKey || null;
  const signerName = order.signature?.signerName || order.responsibleName || null;
  const signerRole = order.signature?.signerRole || order.responsibleRole || null;

  return (
    <main className="min-h-[100svh] bg-steel-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link className="text-sm font-semibold text-cyan-600 hover:text-cyan-700" href="/os/ordens">
          ← Histórico
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wide">Ordem de Serviço</p>
            <h1 className="mt-1 text-2xl font-bold text-navy-950">OS {formattedNumber}</h1>
            <p className="mt-1 text-sm text-steel-500">
              Aberta em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(order.openedAt)}
            </p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusConfig[order.status].bg} ${statusConfig[order.status].text}`}>
            <span className="flex items-center gap-1.5">
              {statusConfig[order.status].icon}
              {statusConfig[order.status].label}
            </span>
          </span>
        </div>

        <section className="mt-7 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
          <h2 className="font-bold text-navy-950">Dados do atendimento</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Cliente</dt>
              <dd className="mt-1 font-semibold text-navy-900">{order.customer.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">CNPJ / CPF</dt>
              <dd className="mt-1 text-navy-900 font-mono">{order.customer.taxId || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Endereço</dt>
              <dd className="mt-1 text-navy-900">
                {[
                  order.customer.address,
                  order.customer.number,
                  order.customer.neighborhood,
                  order.customer.city,
                  order.customer.state,
                  order.customer.postalCode,
                ].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Responsável</dt>
              <dd className="mt-1 text-navy-900">{order.customer.contactName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Telefone</dt>
              <dd className="mt-1 text-navy-900">{order.customer.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">E-mail</dt>
              <dd className="mt-1 text-navy-900">{order.customer.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Elevador</dt>
              <dd className="mt-1 font-semibold text-navy-900">{order.elevator.identification}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Número do elevador</dt>
              <dd className="mt-1 text-navy-900 font-mono">{order.elevator.number || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Fabricante / Modelo</dt>
              <dd className="mt-1 text-navy-900">
                {order.elevator.manufacturer || "—"} {order.elevator.model ? `/ ${order.elevator.model}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Capacidade</dt>
              <dd className="mt-1 text-navy-900">{order.elevator.capacity || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Paradas</dt>
              <dd className="mt-1 text-navy-900">{order.elevator.stops || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Localização</dt>
              <dd className="mt-1 text-navy-900">{order.elevator.location || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Técnico</dt>
              <dd className="mt-1 font-semibold text-navy-900">{order.technician.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Situação</dt>
              <dd className="mt-1 font-semibold text-navy-900">
                {order.situation ? situationLabel[order.situation] : "Não informada"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Início</dt>
              <dd className="mt-1 text-navy-900">
                {order.startTime ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(order.startTime) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Término</dt>
              <dd className="mt-1 text-navy-900">
                {order.endTime ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(order.endTime) : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-4 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
          <h2 className="font-bold text-navy-950">Empresa Contratada</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Razão Social</dt>
              <dd className="mt-1 font-semibold text-navy-900">{order.company.legalName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Nome Fantasia</dt>
              <dd className="mt-1 text-navy-900">{order.company.tradeName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">CNPJ</dt>
              <dd className="mt-1 text-navy-900 font-mono">{order.company.taxId || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Endereço</dt>
              <dd className="mt-1 text-navy-900">
                {[
                  order.company.address,
                  order.company.number,
                  order.company.neighborhood,
                  order.company.city,
                  order.company.state,
                  order.company.postalCode,
                ].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Telefone</dt>
              <dd className="mt-1 text-navy-900">{order.company.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">WhatsApp</dt>
              <dd className="mt-1 text-navy-900">{order.company.whatsapp || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">E-mail</dt>
              <dd className="mt-1 text-navy-900">{order.company.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-steel-400">Site</dt>
              <dd className="mt-1 text-navy-900">{order.company.website || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-4 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
          <h2 className="font-bold text-navy-950">Registros de manutenção ({order.records.length})</h2>
          <div className="mt-4 space-y-4">
            {order.records.map((record, index) => (
              <article key={record.id} className="rounded-lg border border-steel-200 bg-steel-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                    Registro {index + 1} · {record.customPart || record.part}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-navy-700">{record.notes}</p>
                {record.photos && record.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {record.photos.map((photo, photoIndex) => (
                      <img
                        key={photoIndex}
                        src={photo.objectKey}
                        alt={`${record.customPart || record.part} - Foto ${photoIndex + 1}`}
                        className="h-24 w-24 object-cover rounded-lg border border-steel-200"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {order.generalNotes && (
          <section className="mt-4 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
            <h2 className="font-bold text-navy-950">Observações gerais</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-navy-700">{order.generalNotes}</p>
          </section>
        )}

        {order.servicesNotes && (
          <section className="mt-4 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
            <h2 className="font-bold text-navy-950">Serviços realizados</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-navy-700">{order.servicesNotes}</p>
          </section>
        )}

        {order.findingsNotes && (
          <section className="mt-4 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
            <h2 className="font-bold text-navy-950">Apontamentos / Recomendações</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-navy-700">{order.findingsNotes}</p>
          </section>
        )}

        {/* Seção de Assinatura do Responsável */}
        <section className="mt-4 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
          <h2 className="font-bold text-navy-950">Assinatura do Responsável</h2>
          <div className="mt-4 space-y-3">
            {signatureBase64 ? (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-semibold uppercase text-steel-400">Responsável pela aprovação</span>
                    <p className="mt-1 text-navy-900 font-medium">{signerName || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-steel-400">Cargo / Função</span>
                    <p className="mt-1 text-navy-900">{signerRole || "Não informado"}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs font-semibold uppercase text-steel-400">Assinatura</span>
                  <img
                    src={signatureBase64}
                    alt="Assinatura do responsável"
                    className="mt-2 w-full max-w-md h-32 border-2 border-emerald-500 bg-emerald-50 rounded-lg object-contain"
                  />
                </div>
                <p className="text-xs text-emerald-600">Assinatura salva e vinculada a esta OS.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-steel-500">
                <FileText className="h-12 w-12 mx-auto text-steel-300" />
                <p className="mt-2">Nenhuma assinatura registrada</p>
                <p className="text-xs mt-1">A assinatura pode ser adicionada na edição da OS.</p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <PdfButton orderId={order.id} />
          <Link className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg border border-steel-300 bg-white px-4 text-sm font-bold text-navy-700 hover:bg-steel-50 transition-colors" href="/os/ordens">
            Voltar ao histórico
          </Link>
        </div>
      </div>
    </main>
  );
}