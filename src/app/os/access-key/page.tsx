"use client";

import { useState, FormEvent } from "react";
import { LockKeyhole, ArrowRight, AlertCircle, Key } from "lucide-react";

export default function AccessKeyPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const trimmed = key.trim();
      if (!trimmed) {
        setError("Digite a chave de acesso.");
        setLoading(false);
        return;
      }
      // Navega para login com a chave na query string
      window.location.href = `/os/login?key=${encodeURIComponent(trimmed)}`;
    } catch {
      setError("Erro ao processar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100svh] bg-steel-50 px-4 py-8 sm:grid sm:place-items-center">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-sm font-bold tracking-tight text-white">SI</div>
          <div>
            <p className="text-[15px] font-bold tracking-[0.11em] text-navy-950">Smart Intech</p>
            <p className="text-xs font-medium tracking-[0.2em] text-steel-500">ORDEM DE SERVIÇO</p>
          </div>
        </div>
        <section className="rounded-2xl border border-steel-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,.35)] sm:p-9">
          <div className="mb-4 flex items-center gap-2 text-cyan-600">
            <Key className="h-5 w-5" />
            <p className="text-sm font-semibold">ÁREA RESTRITA</p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-950">Chave de acesso necessária</h1>
          <p className="mt-2 text-sm leading-6 text-steel-500">
            Este sistema é privado. Insira a chave mestra fornecida pelo administrador para continuar.
          </p>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-800">Chave mestra</span>
              <span className="flex h-12 items-center gap-3 rounded-lg border border-steel-300 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-cyan-500/15">
                <LockKeyhole aria-hidden="true" className="h-4 w-4 text-steel-400" />
                <input
                  autoComplete="off"
                  className="h-full min-w-0 flex-1 bg-transparent text-base text-navy-900 outline-none placeholder:text-steel-400"
                  type="password"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="••••••••••••••••"
                />
              </span>
            </label>
            {error ? (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            ) : null}
            <button
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "Validando..." : "CONTINUAR"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </section>
        <p className="mt-6 text-center text-xs leading-5 text-steel-500">Acesso exclusivo para equipes autorizadas.</p>
      </div>
    </main>
  );
}