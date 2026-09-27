"use client";

import { useState } from "react";
import { CustomerModal } from "@/components/modals/customer-modal";
import { ElevatorModal } from "@/components/modals/elevator-modal";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  Building,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  taxId: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    elevators: number;
    orders: number;
  };
}

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
  onSave: (customer: any) => Promise<void>;
  saving: boolean;
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [elevatorModalOpen, setElevatorModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactName && c.contactName.toLowerCase().includes(search.toLowerCase())) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  async function loadCustomers() {
    const res = await fetch("/api/os/clientes");
    const data = await res.json();
    setCustomers(data.customers || []);
  }

  async function handleSave(customerData: any) {
    setSaving(true);
    try {
      const method = editingCustomer ? "PUT" : "POST";
      const url = editingCustomer ? `/api/os/clientes/${editingCustomer.id}` : "/api/os/clientes";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (res.ok) {
        setModalOpen(false);
        setEditingCustomer(null);
        loadCustomers();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    await fetch(`/api/os/clientes/${id}`, { method: "DELETE" });
    loadCustomers();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os clientes da sua empresa</p>
        </div>
        <Button onClick={() => { setEditingCustomer(null); setModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar cliente, cidade ou responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-steel-200 bg-white px-10 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {showUpgradeBanner && (
        <UpgradeBanner onDismiss={() => setShowUpgradeBanner(false)}>
          Cadastre mais detalhes dos seus clientes (endereço completo, contatos, observações) para gerar OSs profissionais com todas as informações do seu negócio.
        </UpgradeBanner>
      )}

      <div className="grid gap-4">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="card-editorial card-editorial-interactive">
            <div className="flex items-start justify-between gap-4 p-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-navy-950 truncate">{customer.name}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-steel-600">
                      {customer.contactName && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {customer.contactName}
                        </span>
                      )}
                      {customer.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {customer.city}, {customer.state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  {customer.phone && <div className="flex items-center gap-2 text-steel-700"><Phone className="h-4 w-4 text-steel-500" />{customer.phone}</div>}
                  {customer.email && <div className="flex items-center gap-2 text-steel-700"><Mail className="h-4 w-4 text-steel-500" />{customer.email}</div>}
                  {customer.address && <div className="col-span-full flex items-center gap-2 text-steel-700"><Building className="h-4 w-4 text-steel-500" />{customer.address}, {customer.number} - {customer.neighborhood}</div>}
                </div>
                {customer._count && (
                  <div className="mt-4 flex items-center gap-4">
                    <Badge variant="secondary">{customer._count.elevators} elevadores</Badge>
                    <Badge variant="outline">{customer._count.orders} ordens de serviço</Badge>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditingCustomer(customer); setModalOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setElevatorModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Elevador
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(customer.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={editingCustomer as any}
        onSave={handleSave}
        saving={saving}
      />

      <ElevatorModal
        open={elevatorModalOpen}
        onOpenChange={setElevatorModalOpen}
        customerId={null}
        onSave={async (data) => {
          const res = await fetch("/api/os/elevadores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          if (res.ok) { setElevatorModalOpen(false); loadCustomers(); }
        }}
        saving={false}
      />
    </div>
  );
}