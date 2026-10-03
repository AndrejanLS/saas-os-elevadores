"use client";

import { useState } from "react";
import { Printer, Loader2 } from "lucide-react";

export function PdfButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      // Usa a API remota que já trata formatação de número corretamente
      const response = await fetch(`/api/os/orders/${orderId}/pdf-data`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar a OS.");

      // Chama a API de geração direta passando os dados completos
      const pdfResponse = await fetch(`/api/os/orders/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.order),
      });

      if (!pdfResponse.ok) {
        const err = await pdfResponse.json();
        throw new Error(err.error || "Erro ao gerar PDF");
      }

      // Faz download do blob
      const blob = await pdfResponse.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `os-${data.order.formattedNumber?.replace("/", "-") || "rascunho"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao gerar PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="min-h-12 w-full rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-navy-800 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
            Gerando PDF...
          </>
        ) : (
          <>
            <Printer className="h-4 w-4 mr-2 inline" />
            Gerar PDF
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
