"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Search, Filter } from "lucide-react";

type Order = {
  id: string;
  number: number;
  status: string;
  openedAt: string;
  customer: { name: string };
  elevator: { identification: string };
  technician: { name: string };
  _count: { records: number; photos: number };
};

type Props = {
  orders: Order[];
  customers: string[];
};

export default function OrdersPage({ orders: initialOrders, customers: allCustomers }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  const filtered = useMemo(() => {
    return initialOrders.filter((order) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.elevator.identification.toLowerCase().includes(searchLower) ||
        order.technician.name.toLowerCase().includes(searchLower);

      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesCustomer = !customerFilter || order.customer.name === customerFilter;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [initialOrders, search, statusFilter, customerFilter]);

  return (
    <main className="min-h-[100svh] bg-steel-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <Link className="text-sm font-semibold text-cyan-600 hover:text-cyan-700" href="/os">
              ← Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-950">Ordens de Serviço</h1>
            <p className="mt-1 text-sm text-steel-500">Histórico dos atendimentos da sua empresa.</p>
          </div>
          <Link className="btn-primary flex items-center gap-2" href="/os/ordens/nova">
            <Plus className="h-4 w-4" />
            Nova OS
          </Link>
        </div>

        <div className="card-editorial">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 p-4 border-b border-steel-200">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, elevador ou técnico..."
                className="input-base pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="input-base w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="DRAFT">Rascunho</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
              <select
                className="input-base w-auto"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
              >
                <option value="">Todos os clientes</option>
                {allCustomers.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                className="btn-secondary"
                onClick={() => { setSearch(""); setStatusFilter(""); setCustomerFilter(""); }}
                type="button"
              >
                <Filter className="h-4 w-4" />
                Limpar filtros
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-steel-300" />
              <p className="mt-3 font-semibold text-navy-900">
                {initialOrders.length === 0 ? "Nenhuma ordem encontrada" : "Nenhum resultado para os filtros aplicados"}
              </p>
              <p className="mt-1 text-sm text-steel-500">
                {initialOrders.length === 0 ? "Crie sua primeira ordem de serviço" : "Tente ajustar os filtros"}
              </p>
              {initialOrders.length === 0 && (
                <Link href="/os/ordens/nova" className="mt-4 inline-flex items-center gap-2 btn-primary">
                  <Plus className="h-4 w-4" />
                  Nova OS
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-steel-100">
              {filtered.map((order) => (
                <Link
                  className="flex flex-col gap-3 px-4 py-4 hover:bg-steel-50 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  href={`/os/ordens/${order.id}`}
                  key={order.id}
                >
                  <div>
                    <p className="font-bold text-navy-900">
                      OS {String(order.number).padStart(6, "0")}{" "}
                      <span className="ml-2 text-xs font-medium text-steel-400">
                        {new Intl.DateTimeFormat("pt-BR").format(new Date(order.openedAt))}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-steel-600">{order.customer.name} · {order.elevator.identification}</p>
                    <p className="mt-1 text-xs text-steel-400">Técnico: {order.technician.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-steel-400">
                      {order._count.records} reg.{order._count.photos > 0 && ` + ${order._count.photos} foto${order._count.photos > 1 ? 's' : ''}`}
                    </span>
                    <span className={`w-fit rounded-full px-2.5 py-1 txt-[11px] font-bold ${
                      order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                      order.status === "CANCELLED" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {order.status === "COMPLETED" ? "Concluída" : order.status === "CANCELLED" ? "Cancelada" : "Rascunho"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-steel-200 text-xs text-steel-400">
            {filtered.length} ordem{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </main>
  );
}