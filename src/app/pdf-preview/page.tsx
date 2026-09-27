"use client";

import { useState } from "react";
import { generateOrderPdfFromTemplate } from "@/lib/generate-order-pdf-template";

// Página temporária para visualizar o novo layout do PDF da OS.
// Acesse /pdf-preview e clique em "Gerar PDF de teste".

function makePhoto(label: string, bg: string, fg = "#ffffff"): string {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 420;
  const x = c.getContext("2d")!;
  x.fillStyle = bg;
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 6; i += 1) x.fillRect(40 + i * 100, 60 + i * 25, 70, 220 - i * 20);
  x.fillStyle = fg;
  x.font = "bold 34px sans-serif";
  x.textAlign = "center";
  x.fillText(label, c.width / 2, c.height / 2 + 12);
  return c.toDataURL("image/jpeg", 0.85);
}

async function makeLogo(): Promise<string> {
  const resp = await fetch("/intech-logo.webp");
  if (!resp.ok) throw new Error("logo não encontrada em /intech-logo.webp");
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob);
  const c = document.createElement("canvas");
  c.width = bitmap.width;
  c.height = bitmap.height;
  const x = c.getContext("2d")!;
  x.drawImage(bitmap, 0, 0);
  return c.toDataURL("image/png");
}

export default function PdfPreviewPage() {
  const [status, setStatus] = useState("");

  async function handleGenerate() {
    setStatus("Gerando...");
    try {
      const { generateOrderPdfFromTemplate } = await import("@/lib/generate-order-pdf-template");
      const logoDataUrl = await makeLogo();
      const pdfBytes = await generateOrderPdfFromTemplate({
        order: {
          number: 42,
          openedAt: new Date("2026-09-26T09:59:00"),
          company: {
            logoObjectKey: logoDataUrl,
            legalName: "Intech Elevadores Ltda",
            tradeName: "Intech Elevadores",
            taxId: "12.345.678/0001-90",
            address: "Av. Paulista",
            number: "1000",
            neighborhood: "Bela Vista",
            city: "São Paulo",
            state: "SP",
            postalCode: "01310-100",
            phone: "(11) 3000-0000",
            whatsapp: "(11) 98000-0000",
            email: "contato@intech.com.br",
            website: "www.intech.com.br",
          },
          customer: {
            name: "Condomínio Edifício Central",
            taxId: "98.765.432/0001-10",
            address: "Rua das Flores",
            number: "250",
            complement: "",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            postalCode: "01000-000",
            contactName: "Maria Souza (Síndica)",
            phone: "(11) 4000-0000",
            email: "sindico@edcentral.com.br",
          },
          elevator: "Elevador de Serviço",
          situation: "WITH_NOTES",
          startTime: new Date("2026-09-26T09:59:00"),
          endTime: new Date("2026-09-26T10:59:00"),
          technician: { name: "Márcio Santos" },
          responsibleName: "Sr. Roberto Silva",
          responsibleRole: "Síndico",
          generalNotes:
            "Realizada a manutenção preventiva programada no Elevador de Serviço. Foram executadas a verificação e limpeza das polias de tração, bem como a lubrificação completa dos trilhos e guias mecânicas. Todos os componentes do sistema de segurança testados responderam dentro dos parâmetros normais de operação. Equipamento liberado para uso normal em perfeitas condições de segurança.",
          records: [
            {
              customPart: "POLIAS DE TRAÇÃO E DESVIO",
              notes: "Inspeção visual, alinhamento, desgaste de canais e folga de rolamentos.",
              photos: [
                makePhoto("Registro 1.1", "#16324e"),
                makePhoto("Registro 1.2", "#28486e"),
                makePhoto("Registro 2.1", "#3b5b85"),
                makePhoto("Registro 2.2", "#1e3a5f"),
              ],
            },
            {
              customPart: "LUBRIFICAÇÃO TÉCNICA",
              notes: "Lubrificação geral de guias de cabine, contrapeso e componentes mecânicos.",
              photos: [],
            },
          ],
        },
      });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `os-teste-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("PDF baixado ✔");
    } catch (e) {
      setStatus("Erro: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-bold">Pré-visualização do PDF da OS (Template)</h1>
      <button
        onClick={handleGenerate}
        className="rounded-lg bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-700"
      >
        Gerar PDF de teste
      </button>
      <p className="text-sm text-gray-500">{status}</p>
    </main>
  );
}
