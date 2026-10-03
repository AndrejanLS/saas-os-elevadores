"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, MoveRight, Building2, Eye, EyeOff } from "lucide-react";

export default function OsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/os/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível entrar.");
      router.replace("/os");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar. Tente novamente.");
    } finally {
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
          <p className="text-sm font-semibold text-cyan-600">ÁREA OPERACIONAL</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-950">Acesse sua conta</h1>
          <p className="mt-2 text-sm leading-6 text-steel-500">Entre para consultar clientes e registrar atendimentos.</p>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-800">E-mail</span>
              <span className="flex h-12 items-center gap-3 rounded-lg border border-steel-300 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-cyan-500/15">
                <Mail aria-hidden="true" className="h-4 w-4 text-steel-400" />
                <input autoComplete="username" className="h-full min-w-0 flex-1 bg-transparent text-base text-navy-900 outline-none placeholder:text-steel-400" type="text" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="andrejan@smartintech.com" />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-800">Senha</span>
              <span className="flex h-12 items-center gap-3 rounded-lg border border-steel-300 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-cyan-500/15 relative">
                <LockKeyhole aria-hidden="true" className="h-4 w-4 text-steel-400" />
                <input
                  autoComplete="current-password"
                  className="h-full min-w-0 flex-1 bg-transparent text-base text-navy-900 outline-none pr-10"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-navy-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}
            <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60" disabled={loading} type="submit">
              {loading ? "Entrando..." : "ENTRAR"}<MoveRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </section>
        <p className="mt-6 text-center text-xs leading-5 text-steel-500">Acesso exclusivo para equipes autorizadas.</p>
      </div>
    </main>
  );
}