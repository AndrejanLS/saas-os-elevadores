import Link from "next/link";
import { requireSession } from "@/lib/os-session";
import { db } from "@/lib/db";
import { Plus, Users, Building2, ClipboardList, Building, TrendingUp, Clock, CheckCircle2, AlertCircle, Eye, Download } from "lucide-react";

const situationLabel: Record<string, string> = {
  NORMAL: "Manutenção realizada normalmente",
  WITH_NOTES: "Manutenção realizada com apontamentos",
  QUOTE_REQUIRED: "Necessário orçamento",
  IRREGULARITY: "Equipamento com irregularidade",
};

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  DRAFT: { bg: "bg-amber-50", text: "text-amber-700", label: "Rascunho", icon: <Clock className="h-3 w-3" /> },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Concluída", icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", label: "Cancelada", icon: <AlertCircle className="h-3 w-3" /> },
};

export default async function OsDashboardPage() {
  const session = await requireSession();

  const [totalCustomers, totalElevators, openOrders, completedOrders, recentOrders] = await Promise.all([
    db.customer.count({ where: { companyId: session.companyId } }),
    db.elevator.count({ where: { companyId: session.companyId } }),
    db.serviceOrder.count({ where: { companyId: session.companyId, status: "DRAFT" } }),
    db.serviceOrder.count({ where: { companyId: session.companyId, status: "COMPLETED" } }),
    db.serviceOrder.findMany({
      where: { companyId: session.companyId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        customer: { select: { name: true } },
        elevator: { select: { identification: true } },
        technician: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="container-editorial py-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wide">Área Operacional</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">Dashboard</h1>
          <p className="mt-1 text-sm text-steel-500">Visão geral dos atendimentos da sua empresa.</p>
        </div>
        <Link href="/os/ordens/nova" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nova Ordem de Serviço
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card-editorial">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">Clientes</p>
              <p className="mt-2 text-3xl font-bold text-navy-950">{totalCustomers}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
          <Link href="/os/clientes" className="mt-4 block text-sm font-medium text-cyan-600 hover:text-cyan-700">Gerenciar clientes</Link>
        </div>

        <div className="card-editorial">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">Elevadores</p>
              <p className="mt-2 text-3xl font-bold text-navy-950">{totalElevators}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
          <Link href="/os/elevadores" className="mt-4 block text-sm font-medium text-cyan-600 hover:text-cyan-700">Gerenciar elevadores</Link>
        </div>

        <div className="card-editorial">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">OS Abertas</p>
              <p className="mt-2 text-3xl font-bold text-navy-950">{openOrders}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <Link href="/os/ordens?status=DRAFT" className="mt-4 block text-sm font-medium text-cyan-600 hover:text-cyan-700">Ver rascunhos</Link>
        </div>

        <div className="card-editorial">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">OS Concluídas</p>
              <p className="mt-2 text-3xl font-bold text-navy-950">{completedOrders}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <Link href="/os/ordens?status=COMPLETED" className="mt-4 block text-sm font-medium text-cyan-600 hover:text-cyan-700">Ver concluídas</Link>
        </div>
      </div>

      <section className="card-editorial">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-950">Últimas Ordens de Serviço</h2>
          <Link href="/os/ordens" className="text-sm font-medium text-cyan-600 hover:text-cyan-700">Ver todas</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-steel-300" />
            <p className="mt-3 font-semibold text-navy-900">Nenhuma ordem encontrada</p>
            <p className="mt-1 text-sm text-steel-500">Crie sua primeira ordem de serviço</p>
            <Link href="/os/ordens/nova" className="mt-4 inline-flex items-center gap-2 btn-primary">
              <Plus className="h-4 w-4" />
              Nova OS
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-steel-200 text-left text-xs font-semibold uppercase tracking-wide text-steel-500">
                  <th className="pb-3 pr-4">OS</th>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Elevador</th>
                  <th className="pb-3 pr-4">Técnico</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {recentOrders.map((order) => {
                  const config = statusConfig[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-steel-50 transition-colors">
                      <td className="py-4 pr-4 font-mono text-sm font-medium text-navy-900">
                        OS {String(order.number).padStart(6, "0")}
                      </td>
                      <td className="py-4 pr-4 text-sm text-navy-900">{order.customer.name}</td>
                      <td className="py-4 pr-4 text-sm text-steel-600">{order.elevator.identification}</td>
                      <td className="py-4 pr-4 text-sm text-steel-600">{order.technician.name}</td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${config.bg} ${config.text}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/os/ordens/${order.id}`} className="text-cyan-600 hover:text-cyan-700" title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <a href={`/os/ordens/${order.id}/pdf`} className="text-navy-600 hover:text-navy-800" title="Baixar PDF">
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}