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
      const response = await fetch(`/api/os/orders/${orderId}/pdf-data`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar a OS.");
      const { generateOrderPdf } = await import("@/lib/generate-order-pdf");
      await generateOrderPdf({ order: data.order });
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
