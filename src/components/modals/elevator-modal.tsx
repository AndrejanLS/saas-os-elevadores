"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building, Save, Loader2 } from "lucide-react";

interface ElevatorFormData {
  identification: string;
  number: string;
  manufacturer: string;
  model: string;
  capacity: string;
  stops: string;
  location: string;
  type: string;
  notes: string;
  customerId: string;
}

interface ElevatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  onSave: (elevator: ElevatorFormData) => Promise<void>;
  saving: boolean;
}

export function ElevatorModal({ open, onOpenChange, customerId, onSave, saving }: ElevatorModalProps) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<ElevatorFormData>({
    identification: "",
    number: "",
    manufacturer: "",
    model: "",
    capacity: "",
    stops: "",
    location: "",
    type: "",
    notes: "",
    customerId: customerId || "",
  });

  useEffect(() => {
    fetch("/api/os/clientes")
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers || []));
  }, []);

  useEffect(() => {
    if (customerId) {
      setFormData((prev) => ({ ...prev, customerId }));
    }
  }, [customerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(formData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Novo Elevador
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="customerId">Cliente *</Label>
              <select
                id="customerId"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                required
                disabled={!!customerId}
              >
                <option value="">Selecione um cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="identification">Identificação *</Label>
              <Input
                id="identification"
                value={formData.identification}
                onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                placeholder="Ex: Elevador Principal"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="Ex: Elevador 01"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Ex: Otis"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: Gen2"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="capacity">Capacidade</Label>
              <Input
                id="capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Ex: 450kg / 6 pessoas"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="stops">Paradas</Label>
              <Input
                id="stops"
                value={formData.stops}
                onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                placeholder="Ex: 10"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Hall principal"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Ex: Passageiros / Carga"
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o elevador..."
                rows={3}
                className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Elevador
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}