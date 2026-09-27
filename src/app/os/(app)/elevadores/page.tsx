"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Building2, Trash2, Edit, X, Check, Building } from "lucide-react";

type Elevator = {
  id: string;
  identification: string;
  number: string | null;
  manufacturer: string | null;
  model: string | null;
  capacity: string | null;
  stops: string | null;
  customer: { name: string };
};

export default function ElevatorsPage() {
  const router = useRouter();
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingElevator, setEditingElevator] = useState<Elevator | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    identification: "",
    number: "",
    manufacturer: "",
    model: "",
    capacity: "",
    stops: "",
    location: "",
    type: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchElevators();
    fetchCustomers();
  }, [search, filterCustomer]);

  async function fetchElevators() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCustomer) params.set("customerId", filterCustomer);
      const response = await fetch(`/api/os/elevators?${params.toString()}`);
      const data = await response.json();
      if (response.ok) setElevators(data.elevators || []);
      else setError(data.error || "Erro ao carregar elevadores");
    } catch {
      setError("Erro ao carregar elevadores");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const response = await fetch("/api/os/customers");
      const data = await response.json();
      if (response.ok) setCustomers(data.customers || []);
    } catch {
      // silencioso
    }
  }

  function openCreateModal() {
    setEditingElevator(null);
    setFormData({
      customerId: "", identification: "", number: "", manufacturer: "",
      model: "", capacity: "", stops: "", location: "", type: "", notes: "",
    });
    setShowModal(true);
  }

  function openEditModal(elevator: Elevator) {
    setEditingElevator(elevator);
    setFormData({
      customerId: "", // será preenchido ao buscar detalhes
      identification: elevator.identification,
      number: elevator.number || "",
      manufacturer: elevator.manufacturer || "",
      model: elevator.model || "",
      capacity: elevator.capacity || "",
      stops: elevator.stops || "",
      location: "", type: "", notes: "",
    });
    setShowModal(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const url = editingElevator
        ? `/api/os/elevators/${editingElevator.id}`
        : "/api/os/elevators";
      const method = editingElevator ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar elevador");
      setShowModal(false);
      fetchElevators();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar elevador");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este elevador?")) return;
    try {
      const response = await fetch(`/api/os/elevators/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir elevador");
      fetchElevators();
    } catch {
      alert("Erro ao excluir elevador");
    }
  }

  if (loading) {
    return (
      <div className="container-editorial py-6 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-editorial py-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wide">Cadastros</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">Elevadores</h1>
          <p className="mt-1 text-sm text-steel-500">Gerencie os equipamentos de cada cliente.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="h-4 w-4" />
          Novo Elevador
        </button>
      </div>

      <div className="card-editorial">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-400" />
            <input
              type="text"
              placeholder="Buscar elevador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="input-base w-auto"
          >
            <option value="">Todos os clientes</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel-200 text-left text-xs font-semibold uppercase tracking-wide text-steel-500">
                <th className="pb-3 pr-4">Identificação</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Número</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Fabricante</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Modelo</th>
                <th className="pb-3 pr-4">Cliente</th>
                <th className="pb-3 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {elevators.filter(e => e.identification.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                <tr>
                  <td className="py-12 text-center text-steel-500 col-span-6">
                    <Building2 className="mx-auto h-12 w-12 text-steel-300" />
                    <p className="mt-3 font-semibold text-navy-900">Nenhum elevador encontrado</p>
                    <p className="mt-1 text-sm text-steel-500">Clique em "Novo Elevador" para cadastrar</p>
                  </td>
                </tr>
              ) : (
                elevators
                  .filter(e => e.identification.toLowerCase().includes(search.toLowerCase()))
                  .map((elevator) => (
                    <tr key={elevator.id} className="hover:bg-steel-50 transition-colors">
                      <td className="py-4 pr-4 font-medium text-navy-900">{elevator.identification}</td>
                      <td className="py-4 pr-4 hidden md:table-cell text-sm text-steel-600">{elevator.number || "—"}</td>
                      <td className="py-4 pr-4 hidden lg:table-cell text-sm text-steel-600">{elevator.manufacturer || "—"}</td>
                      <td className="py-4 pr-4 hidden lg:table-cell text-sm text-steel-600">{elevator.model || "—"}</td>
                      <td className="py-4 pr-4 text-sm text-steel-600">{elevator.customer.name}</td>
                      <td className="py-4 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(elevator)} className="text-cyan-600 hover:text-cyan-700 p-2" title="Editar">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(elevator.id)} className="text-red-600 hover:text-red-700 p-2" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-0">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-elevated">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-navy-950">{editingElevator ? "Editar Elevador" : "Novo Elevador"}</h2>
                <p className="mt-1 text-sm text-steel-500">Preencha os dados do equipamento.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-steel-400 hover:text-steel-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-base">Cliente *</label>
                  <select required value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} className="input-base">
                    <option value="">Selecione o cliente</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label-base">Identificação *</label>
                  <input type="text" required value={formData.identification} onChange={(e) => setFormData({ ...formData, identification: e.target.value })} className="input-base" placeholder="Ex: Elevador Social, Elevador de Serviço, Elevador 01" />
                </div>
                <div>
                  <label className="label-base">Número do Elevador</label>
                  <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="input-base" placeholder="Ex: 12345" />
                </div>
                <div>
                  <label className="label-base">Fabricante</label>
                  <input type="text" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} className="input-base" placeholder="Otis, ThyssenKrupp, Atlas, Schindler..." />
                </div>
                <div>
                  <label className="label-base">Modelo</label>
                  <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="input-base" placeholder="Ex: Gen2, Evolution, Mega..." />
                </div>
                <div>
                  <label className="label-base">Capacidade</label>
                  <input type="text" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="input-base" placeholder="Ex: 8 passageiros / 600 kg" />
                </div>
                <div>
                  <label className="label-base">Paradas</label>
                  <input type="text" value={formData.stops} onChange={(e) => setFormData({ ...formData, stops: e.target.value })} className="input-base" placeholder="Ex: 12" />
                </div>
                <div>
                  <label className="label-base">Localização</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-base" placeholder="Ex: Bloco A, Torre Principal" />
                </div>
                <div>
                  <label className="label-base">Tipo</label>
                  <input type="text" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-base" placeholder="Ex: Passageiros, Carga, Serviço, Panorâmico" />
                </div>
              </div>
              <div>
                <label className="label-base">Observações</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="input-base" placeholder="Informações adicionais..." />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-steel-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Salvando..." : editingElevator ? "Atualizar" : "Criar"}
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}