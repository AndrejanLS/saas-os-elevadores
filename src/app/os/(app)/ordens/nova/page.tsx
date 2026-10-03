"use client";

import { useState, useEffect, type FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, Check, Trash2, Camera, Image, Loader2, AlertCircle, Building2, Search, FileText, Building } from "lucide-react";
import { generateOrderPdf } from "@/lib/generate-order-pdf";

const SITUATIONS = [
  { value: "NORMAL", label: "Manutenção realizada normalmente" },
  { value: "WITH_NOTES", label: "Manutenção realizada com apontamentos" },
  { value: "QUOTE_REQUIRED", label: "Necessário orçamento" },
  { value: "IRREGULARITY", label: "Equipamento com irregularidade" },
];

const PART_SUGGESTIONS = [
  "Casa de máquinas",
  "Poço",
  "Cabine",
  "Topo da cabine",
  "Portas",
  "Operadores de porta",
  "Pavimentos",
  "Quadro de comando",
  "Máquina de tração",
  "Limitador de velocidade",
  "Sistema de segurança",
  "Freio",
  "Cabos de tração",
  "Polias",
  "Guias",
  "Contrapeso",
  "Lubrificação",
  "Nivelamento",
  "Iluminação",
  "Comunicação",
  "Ajustes",
  "Inspeção geral",
  "Outro",
];

type Customer = {
  id: string;
  name: string;
  address?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
};
type Elevator = { id: string; customerId: string; identification: string };
type RecordInput = { part: string; customPart: string; notes: string; photos: string[] };

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [elevatorId, setElevatorId] = useState("");
  const [elevatorIdentification, setElevatorIdentification] = useState("");
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [records, setRecords] = useState<RecordInput[]>([{ part: "", customPart: "", notes: "", photos: [] }]);
  const [situation, setSituation] = useState("NORMAL");

  // Sync customerId from DOM on mount (handles cases where browser autofill or eval sets select value)
  useEffect(() => {
    const sel = document.querySelector('select') as HTMLSelectElement;
    if (sel && sel.value && !customerId) {
      setCustomerId(sel.value);
    }
  }, [customerId]);

  // DEBUG: force sync if select has value but state is empty
  useEffect(() => {
    const sel = document.querySelector('select') as HTMLSelectElement;
    if (sel && sel.value && sel.value !== customerId) {
      console.log('[DEBUG] syncing customerId from DOM:', sel.value);
      setCustomerId(sel.value);
    }
  }, [customerId]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleRole, setResponsibleRole] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [signaturePad, setSignaturePad] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redesenha a assinatura salva no canvas toda vez que ele monta ou re-renderiza.
  // O navegador limpa o canvas em re-renders do React, então restauramos a partir
  // do dataURL salvo em propriedade do próprio canvas (sobrevive a re-renders).
  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const imageData = (canvas as any).signatureData as string | undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!imageData) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageData;
  });

  // Desenho da assinatura - conteúdo persistido no próprio canvas
  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      if (e.cancelable) e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (e.type === 'mousedown' || e.type === 'touchstart') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      (canvas as any).isDrawing = true;
    } else if ((e.type === 'mousemove' || e.type === 'touchmove') && (canvas as any).isDrawing) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else if (e.type === 'mouseup' || e.type === 'touchend') {
      if (!(canvas as any).isDrawing) return;
      (canvas as any).isDrawing = false;
      // Salva o conteúdo NO PRÓPRIO CANVAS - sobrevive a re-renders do React
      (canvas as any).signatureData = canvas.toDataURL('image/png');
    }
  };

  const confirmSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    // Trava a assinatura: salva no state React para o preview fixo
    setSignaturePad(canvas.toDataURL('image/png'));
    setShowSignaturePad(false);
  };

  const clearSignature = () => {
    setSignaturePad(null);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      (canvas as any).signatureData = undefined;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Fetch company data for display
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/os/company")
      .then((response) => response.json())
      .then((data) => setCompanyData(data.company))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/os/customers")
      .then((response) => response.json())
      .then((data) => setCustomers(data.customers || []))
      .catch(() => setError("Não foi possível carregar os clientes."));
  }, []);

  useEffect(() => {
    if (!customerId) {
      setElevators([]);
      setElevatorId("");
      setElevatorIdentification("");
      setCustomerData(null);
      return;
    }

    // Fetch elevators for this customer
    fetch(`/api/os/elevators?customerId=${encodeURIComponent(customerId)}`)
      .then((response) => response.json())
      .then((data) => setElevators(data.elevators || []))
      .catch(() => setError("Não foi possível carregar os elevadores."));

    // Busca os dados completos do cliente direto na API (a lista pode vir sem os campos)
    setCustomerData(null);
    fetch(`/api/os/customers/${encodeURIComponent(customerId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar os dados do cliente.");
        setCustomerData(data.customer);
      })
      .catch((cause) => {
        setCustomerData(null);
        setError(cause instanceof Error ? cause.message : "Não foi possível carregar os dados do cliente.");
      });
  }, [customerId]);

  function updateRecord(index: number, patch: Partial<RecordInput>) {
    setRecords((current) =>
      current.map((record, itemIndex) =>
        itemIndex === index ? { ...record, ...patch } : record
      )
    );
  }

  function handleFileSelect(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentPhotos = records[index].photos;
    const newPhotos: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPhotos.push(e.target?.result as string);
          if (newPhotos.length === files.length) {
            updateRecord(index, { photos: [...currentPhotos, ...newPhotos] });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function removePhoto(recordIndex: number, photoIndex: number) {
    updateRecord(recordIndex, {
      photos: records[recordIndex].photos.filter((_, i) => i !== photoIndex),
    });
  }

  function openCamera(recordIndex: number) {
    fileInputRefs.current[recordIndex]?.click();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/os/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          elevatorId,
          elevatorIdentification,
          records: records.map((r) => ({
            part: r.part,
            customPart: r.customPart || undefined,
            notes: r.notes,
            photos: r.photos,
          })),
          situation,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          responsibleName,
          responsibleRole,
          generalNotes,
          signature: signaturePad,
          servicesNotes: "",
          findingsNotes: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a OS.");
      router.push(`/os/ordens/${data.order.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a OS.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePDF() {
    // Fallback: read customerId directly from DOM if state is empty
    const sel = document.querySelector('select') as HTMLSelectElement;
    const effectiveCustomerId = customerId || sel?.value || "";
    console.log('[PDF] handleGeneratePDF called', { customerId, effectiveCustomerId, generatingPdf, saving });
    setError("");
    if (!effectiveCustomerId) {
      const msg = "Selecione o cliente para gerar o PDF.";
      console.log('[PDF] blocked: no customerId');
      setError(msg);
      return;
    }
    setGeneratingPdf(true);
    try {
      const selectedElevator = elevators.find((e) => e.id === elevatorId);
      const validRecords = records.filter((r) => r.notes.trim());

      // Ensure customerData is loaded
      let effectiveCustomerData = customerData;
      if (!effectiveCustomerData) {
        console.log('[PDF] fetching customer data...');
        const resp = await fetch(`/api/os/customers/${encodeURIComponent(effectiveCustomerId)}`);
        const data = await resp.json();
        if (resp.ok && data.customer) {
          effectiveCustomerData = data.customer;
          setCustomerData(effectiveCustomerData);
        }
      }

      console.log('[PDF] calling API generate-pdf...');
      const resp = await fetch('/api/os/orders/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyData,
          customer: effectiveCustomerData,
          elevatorLabel: elevatorId === "__new__" ? elevatorIdentification : selectedElevator?.identification || "",
          records: validRecords,
          situation,
          startTime: startTime || null,
          endTime: endTime || null,
          responsibleName,
          responsibleRole,
          technicianName: "",
          generalNotes,
          signature: signaturePad,
          orderNumber: 0,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const disposition = resp.headers.get('Content-Disposition');
      let fileName = 'os-rascunho.pdf';
      if (disposition) {
        const match = disposition.match(/filename="([^"]+)"/);
        if (match) fileName = match[1];
      }
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[PDF] download triggered via API');
    } catch (cause) {
      console.error('[PDF] error:', cause);
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <main className="min-h-[100svh] bg-steel-50 px-4 py-6 sm:px-6 sm:py-10">
      <form className="mx-auto max-w-4xl" onSubmit={submit}>
        <Link className="text-sm font-semibold text-cyan-600 hover:text-cyan-700" href="/os">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-950">Nova Ordem de Serviço</h1>
        <p className="mt-1 text-sm text-steel-500">Manutenção preventiva · os dados ficam vinculados ao técnico logado.</p>

        {/* Company Header Preview */}
        {companyData && (
          <section className="mt-4 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
            <h2 className="font-bold text-navy-950">Empresa Contratada (aparecerá no PDF)</h2>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-steel-400" />
                <span className="font-semibold text-navy-900">{companyData.legalName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-steel-400" />
                <span className="text-navy-900">{companyData.tradeName || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-steel-400" />
                <span className="text-navy-900 font-mono">{companyData.taxId || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-steel-400" />
                <span className="text-navy-900">
                  {[
                    companyData.address,
                    companyData.number,
                    companyData.neighborhood,
                    companyData.city,
                    companyData.state,
                    companyData.postalCode,
                  ].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-steel-400" />
                <span className="text-navy-900">{companyData.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-steel-400" />
                <span className="text-navy-900">{companyData.whatsapp || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-steel-400" />
                <span className="text-navy-900">{companyData.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-steel-400" />
                <span className="text-navy-900">{companyData.website || "—"}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-steel-500">Para alterar estes dados, acesse Configurações → Minha Empresa.</p>
          </section>
        )}

        <section className="mt-7 space-y-5 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
          <h2 className="font-bold text-navy-950">Dados do atendimento</h2>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <label className="block">
              <span className="label-base">Cliente / Condomínio *</span>
              <select
                className="input-base"
                required
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <option value="">Selecione o cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Elevator selection - allows either selecting existing or typing new */}
            <div className="sm:col-span-2">
              <label className="block">
                <span className="label-base">Elevador *</span>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      className="input-base flex-1"
                      value={elevatorId}
                      onChange={(event) => {
                        setElevatorId(event.target.value);
                        setElevatorIdentification("");
                      }}
                      disabled={!customerId}
                    >
                      <option value="">Selecione um elevador existente</option>
                      {elevators.map((elevator) => (
                        <option key={elevator.id} value={elevator.id}>
                          {elevator.identification}
                        </option>
                      ))}
                      <option value="__new__">+ Digitar identificação do elevador manualmente</option>
                    </select>
                  </div>
                  {elevatorId === "__new__" && (
                    <input
                      type="text"
                      className="input-base"
                      placeholder="Ex: Elevador Social Principal, Otis Gen2, etc."
                      value={elevatorIdentification}
                      onChange={(e) => setElevatorIdentification(e.target.value)}
                      required
                    />
                  )}
                </div>
              </label>
            </div>

            <label className="block">
              <span className="label-base">Data / Horário de Início</span>
              <input
                type="datetime-local"
                className="input-base"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label-base">Horário de Término</span>
              <input
                type="datetime-local"
                className="input-base"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="label-base">Técnico Responsável</span>
              <input
                type="text"
                className="input-base"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Nome do técnico"
              />
            </label>
          </div>

          {/* Customer Details Display */}
          {customerId && !customerData && !error && (
            <div className="mt-5 pt-5 border-t border-steel-200">
              <h3 className="font-semibold text-navy-950 mb-3">Dados do Cliente / Condomínio</h3>
              <p className="text-sm text-steel-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dados do cliente...
              </p>
            </div>
          )}
          {customerData && (
            <div className="mt-5 pt-5 border-t border-steel-200">
              <h3 className="font-semibold text-navy-950 mb-3">Dados do Cliente / Condomínio</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase text-steel-400">Nome</span>
                  <p className="mt-1 text-navy-900 font-medium">{customerData.name || "Não informado"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-steel-400">Endereço</span>
                  <p className="mt-1 text-navy-900 font-medium">
                    {[
                      [customerData.address, customerData.number].filter(Boolean).join(", "),
                      customerData.complement,
                      customerData.neighborhood,
                      [customerData.city, customerData.state].filter(Boolean).join(" - "),
                      customerData.postalCode,
                    ].filter((p) => p && String(p).trim()).join(", ") || "Não informado"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-steel-400">Responsável</span>
                  <p className="mt-1 text-navy-900 font-medium">{customerData.contactName || "Não informado"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-steel-400">Telefone</span>
                  <p className="mt-1 text-navy-900 font-medium">{customerData.phone || "Não informado"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-steel-400">E-mail</span>
                  <p className="mt-1 text-navy-900 font-medium">{customerData.email || "Não informado"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-steel-400">CNPJ / CPF</span>
                  <p className="mt-1 text-navy-900 font-mono">{customerData.taxId || "Não informado"}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-4 space-y-5 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-navy-950">Registros de manutenção</h2>
              <p className="mt-1 text-sm text-steel-500">Adicione uma observação para cada parte inspecionada. Fotos são opcionais.</p>
            </div>
            <button
              className="rounded-lg border border-cyan-500 px-3 py-2 text-xs font-bold text-cyan-600 hover:bg-cyan-50 transition-colors"
              onClick={() => setRecords((current) => [...current, { part: "", customPart: "", notes: "", photos: [] }])}
              type="button"
            >
              <Plus className="h-3 w-3 mr-1" />
              + Registro
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {records.map((record, index) => (
              <div
                key={index}
                className="rounded-lg border border-steel-200 bg-steel-50 p-4"
                ref={(el) => { fileInputRefs.current[index] = el?.querySelector('input[type="file"]') || null; }}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(index, e)}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-steel-500">Registro {index + 1}</p>
                  {records.length > 1 ? (
                    <button
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                      onClick={() => setRecords((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      type="button"
                    >
                      <Trash2 className="h-3 w-3 inline mr-1" />
                      Remover
                    </button>
                  ) : null}
                </div>

                <label className="mt-3 block">
                  <span className="label-base">Parte / Local / Sistema *</span>
                  <select
                    className="input-base"
                    required
                    value={record.part}
                    onChange={(event) => updateRecord(index, { part: event.target.value })}
                  >
                    <option value="">Selecione uma parte</option>
                    {PART_SUGGESTIONS.map((part) => (
                      <option key={part} value={part}>
                        {part}
                      </option>
                    ))}
                  </select>
                </label>

                {record.part === "Outro" && (
                  <label className="mt-3 block">
                    <span className="label-base">Especifique a parte</span>
                    <input
                      type="text"
                      className="input-base"
                      placeholder="Ex: Sensor de porta do 5º pavimento"
                      value={record.customPart}
                      onChange={(event) => updateRecord(index, { customPart: event.target.value })}
                    />
                  </label>
                )}

                <label className="mt-3 block">
                  <span className="label-base">Descrição / Serviço Realizado / Apontamento *</span>
                  <textarea
                    className="input-base min-h-[120px] resize-y"
                    placeholder="Descreva o que foi realizado, identificado ou recomendado..."
                    required
                    value={record.notes}
                    onChange={(event) => updateRecord(index, { notes: event.target.value })}
                  />
                </label>

                <label className="mt-3 block">
                  <span className="label-base">Fotos deste registro</span>
                  <div className="flex flex-wrap gap-2">
                    {record.photos.map((photo, photoIndex) => (
                      <div key={photoIndex} className="relative group">
                        <img
                          src={photo}
                          alt={`Foto ${photoIndex + 1}`}
                          className="h-20 w-20 object-cover rounded-lg border border-steel-200 cursor-pointer"
                          onClick={() => window.open(photo, '_blank')}
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePhoto(index, photoIndex); }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remover foto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => openCamera(index)}
                      className="h-20 w-20 flex items-center justify-center rounded-lg border-2 border-dashed border-steel-300 hover:border-cyan-500 hover:bg-cyan-50 transition-colors"
                    >
                      <Camera className="h-6 w-6 text-steel-400" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-steel-500">Toque na foto para ampliar. Toque no ícone 📷 para abrir câmera/galeria.</p>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 space-y-5 rounded-xl border border-steel-200 bg-white p-4 sm:p-6">
          <h2 className="font-bold text-navy-950">Situação e Responsável</h2>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold text-navy-800">Situação da manutenção</legend>
            {SITUATIONS.map((item) => (
              <label key={item.value} className="flex min-h-10 items-center gap-3 text-sm text-navy-700">
                <input
                  className="h-5 w-5 accent-cyan-600"
                  name="situation"
                  type="radio"
                  value={item.value}
                  checked={situation === item.value}
                  onChange={(event) => setSituation(event.target.value)}
                />
                {item.label}
              </label>
            ))}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <label className="block">
              <span className="label-base">Responsável pelo acompanhamento</span>
              <input
                className="input-base"
                value={responsibleName}
                onChange={(event) => setResponsibleName(event.target.value)}
                placeholder="Nome do responsável"
              />
            </label>
            <label className="block">
              <span className="label-base">Cargo / Função</span>
              <input
                className="input-base"
                value={responsibleRole}
                onChange={(event) => setResponsibleRole(event.target.value)}
                placeholder="Ex: Síndico, Zelador, Administradora"
              />
            </label>
          </div>

          <label className="block mt-4">
            <span className="label-base">Observações gerais</span>
            <textarea
              className="input-base min-h-[100px] resize-y"
              value={generalNotes}
              onChange={(event) => setGeneralNotes(event.target.value)}
              placeholder="Observações livres sobre o atendimento..."
            />
          </label>

          <label className="block mt-4">
            <span className="label-base">Assinatura do responsável</span>
            <div className="space-y-2">
              {/* Assinatura confirmada: preview fixo verde */}
              {signaturePad ? (
                <div className="space-y-3">
                  <img
                    src={signaturePad}
                    alt="Assinatura confirmada"
                    className="w-full h-32 border-2 border-emerald-500 bg-emerald-50 rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 mr-1 inline" />
                    Remover assinatura
                  </button>
                  <p className="mt-1 text-xs text-steel-500">Assinatura salva. Clique em "Remover" para refazer.</p>
                </div>
              ) : !showSignaturePad ? (
                <button
                  type="button"
                  onClick={() => setShowSignaturePad(true)}
                  className="flex items-center justify-center gap-2 h-20 w-full border-2 border-dashed border-steel-300 rounded-lg text-steel-500 hover:border-cyan-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span>Adicionar assinatura</span>
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Canvas de desenho - persistência via canvas.signatureData + useEffect de restore */}
                  <canvas
                    ref={signatureCanvasRef}
                    className="w-full h-32 border-2 border-steel-300 bg-white rounded-lg touch-none cursor-crosshair"
                    onMouseDown={drawSignature}
                    onMouseMove={drawSignature}
                    onMouseUp={drawSignature}
                    onMouseLeave={drawSignature}
                    onTouchStart={drawSignature}
                    onTouchMove={drawSignature}
                    onTouchEnd={drawSignature}
                    width={600}
                    height={128}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="flex-1 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <X className="h-3 w-3 mr-1 inline" />
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={confirmSignature}
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 transition-colors"
                    >
                      <Check className="h-3 w-3 mr-1 inline" />
                      Confirmar
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-steel-500">Desenhe com o dedo (celular) ou mouse. Toque em Confirmar para salvar.</p>
                </div>
              )}
            </div>
          </label>
        </section>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="min-h-12 flex-1 rounded-lg border border-steel-300 bg-white px-4 text-sm font-bold text-navy-700 hover:bg-steel-50 transition-colors disabled:opacity-60"
            onClick={handleGeneratePDF}
            type="button"
            disabled={saving || generatingPdf}
          >
            {generatingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2 inline" />
                Gerar PDF
              </>
            )}
          </button>
          <button
            className="min-h-12 flex-1 rounded-lg bg-primary px-5 text-sm font-bold text-white disabled:opacity-60 hover:bg-navy-800 transition-colors"
            disabled={saving}
            type="submit"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                SALVAR ORDEM DE SERVIÇO
                <Check className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}