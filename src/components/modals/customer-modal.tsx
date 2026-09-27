"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, Save, Loader2 } from "lucide-react";

interface CustomerFormData {
  name: string;
  taxId: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY_FORM: CustomerFormData = {
  name: "",
  taxId: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  contactName: "",
  phone: "",
  email: "",
  notes: "",
};

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Partial<Record<keyof CustomerFormData, string | null>> | null;
  onSave: (customer: CustomerFormData) => Promise<void>;
  saving: boolean;
}

export function CustomerModal({ open, onOpenChange, customer, onSave, saving }: CustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>(EMPTY_FORM);

  useEffect(() => {
    setFormData({
      name: customer?.name ?? "",
      taxId: customer?.taxId ?? "",
      address: customer?.address ?? "",
      number: customer?.number ?? "",
      complement: customer?.complement ?? "",
      neighborhood: customer?.neighborhood ?? "",
      city: customer?.city ?? "",
      state: customer?.state ?? "",
      postalCode: customer?.postalCode ?? "",
      contactName: customer?.contactName ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      notes: customer?.notes ?? "",
    });
  }, [customer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(formData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {customer ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nome do Cliente / Condomínio *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Condomínio Edifício Central"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="taxId">CNPJ / CPF</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contactName">Nome do Responsável (Síndico, Zelador, etc.)</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="João Silva"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sindico@condominio.com.br"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2 border-t border-steel-200 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-navy-800 mb-3">Endereço Completo</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Endereço (Rua, Av., etc.)</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua das Flores, 123"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    placeholder="Sala 101, Bloco A"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Centro"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">UF</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">CEP</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="00000-000"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações gerais sobre o cliente..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-steel-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Cliente
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
