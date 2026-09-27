"use client";

import { useState, useEffect, type FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building, Save, X, Check, Loader2, Image, Upload, Trash2 } from "lucide-react";

export default function CompanySettingsPage() {
  const [company, setCompany] = useState({
    legalName: "",
    tradeName: "",
    taxId: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    logoObjectKey: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  async function fetchCompany() {
    try {
      const response = await fetch("/api/os/company");
      const data = await response.json();
      if (response.ok) {
        setCompany(data.company);
        if (data.company.logoObjectKey) {
          setLogoPreview(data.company.logoObjectKey);
        }
      } else {
        setError(data.error || "Erro ao carregar dados da empresa");
      }
    } catch {
      setError("Erro ao carregar dados da empresa");
    } finally {
      setLoading(false);
    }
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Arquivo deve ser uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem deve ter no máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        // Converte qualquer formato (incl. AVIF) para PNG — compatível com o gerador de PDF
        const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const pngDataUrl = canvas.toDataURL("image/png");
        setLogoPreview(pngDataUrl);
        setCompany({ ...company, logoObjectKey: pngDataUrl });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoPreview(null);
    setCompany({ ...company, logoObjectKey: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const response = await fetch("/api/os/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar");
      setSuccess("Empresa atualizada com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar empresa");
    } finally {
      setSaving(false);
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
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wide">Configurações</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">Minha Empresa</h1>
          <p className="mt-1 text-sm text-steel-500">Dados que aparecerão nas Ordens de Serviço e PDFs.</p>
        </div>
      </div>

      <div className="card-editorial max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo da empresa"
                className="h-24 w-auto max-w-[200px] object-contain rounded-lg border border-steel-200"
              />
            ) : (
              <div className="h-24 w-[200px] rounded-lg border-2 border-dashed border-steel-300 flex items-center justify-center bg-steel-50">
                <span className="text-steel-400 text-sm">Sem logo</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
              id="logo-upload"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="logo-upload" className="btn-secondary">
              <Upload className="h-4 w-4" />
              {logoPreview ? "Alterar Logo" : "Carregar Logo"}
            </label>
            {logoPreview && (
              <button type="button" onClick={removeLogo} className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                Remover Logo
              </button>
            )}
            <p className="text-xs text-steel-500">Formatos: JPG, PNG, SVG. Máx: 5MB. A logo aparecerá no cabeçalho da OS e no PDF.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-t border-steel-200 pt-6">
            <h2 className="text-lg font-semibold text-navy-950 mb-4">Dados da Empresa</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label-base">Razão Social *</label>
                <input
                  type="text"
                  required
                  value={company.legalName}
                  onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
                  className="input-base"
                  placeholder="Empresa de Elevadores LTDA"
                />
              </div>
              <div>
                <label className="label-base">Nome Fantasia</label>
                <input
                  type="text"
                  value={company.tradeName}
                  onChange={(e) => setCompany({ ...company, tradeName: e.target.value })}
                  className="input-base"
                  placeholder="Elevadores Brasil"
                />
              </div>
              <div>
                <label className="label-base">CNPJ</label>
                <input
                  type="text"
                  value={company.taxId}
                  onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                  className="input-base"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-steel-200 pt-6">
            <h2 className="text-lg font-semibold text-navy-950 mb-4">Endereço</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="label-base">Endereço (Rua, Av.)</label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="input-base"
                  placeholder="Rua das Flores"
                />
              </div>
              <div>
                <label className="label-base">Número</label>
                <input
                  type="text"
                  value={company.number}
                  onChange={(e) => setCompany({ ...company, number: e.target.value })}
                  className="input-base"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="label-base">Complemento</label>
                <input
                  type="text"
                  value={company.complement}
                  onChange={(e) => setCompany({ ...company, complement: e.target.value })}
                  className="input-base"
                  placeholder="Sala 101, Bloco A"
                />
              </div>
              <div>
                <label className="label-base">Bairro</label>
                <input
                  type="text"
                  value={company.neighborhood}
                  onChange={(e) => setCompany({ ...company, neighborhood: e.target.value })}
                  className="input-base"
                  placeholder="Centro"
                />
              </div>
              <div>
                <label className="label-base">Cidade</label>
                <input
                  type="text"
                  value={company.city}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  className="input-base"
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label className="label-base">UF</label>
                <input
                  type="text"
                  value={company.state}
                  onChange={(e) => setCompany({ ...company, state: e.target.value })}
                  className="input-base"
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="label-base">CEP</label>
                <input
                  type="text"
                  value={company.postalCode}
                  onChange={(e) => setCompany({ ...company, postalCode: e.target.value })}
                  className="input-base"
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-steel-200 pt-6">
            <h2 className="text-lg font-semibold text-navy-950 mb-4">Contato</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-base">Telefone</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="input-base"
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div>
                <label className="label-base">WhatsApp</label>
                <input
                  type="text"
                  value={company.whatsapp}
                  onChange={(e) => setCompany({ ...company, whatsapp: e.target.value })}
                  className="input-base"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="label-base">E-mail</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="input-base"
                  placeholder="contato@empresa.com.br"
                />
              </div>
              <div>
                <label className="label-base">Site</label>
                <input
                  type="url"
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  className="input-base"
                  placeholder="https://empresa.com.br"
                />
              </div>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
          {success && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="alert">{success}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-steel-200">
            <button type="button" className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Empresa
                </>
              )}
              <Check className="h-4 w-4 ml-2" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}