import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/os-session";
import { db, isDbAvailable } from "@/lib/db";
import { Plus, Users, Building2, ClipboardList, Building, TrendingUp } from "lucide-react";

// BYPASS DE EMERGÊNCIA para tela /os quando DB falhar
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/os-session";
import { db, isDbAvailable } from "@/lib/db";
import { Plus, Users, Building2, ClipboardList, Building, TrendingUp } from "lucide-react";

export default async function OsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  // Se DB não está disponível, mostra estado neutro
  if (!isDbAvailable()) {
    return (
      <div className="min-h-screen bg-steel-50 flex items-center justify-center p-4">
        <div className="card-editorial max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-navy-950 mb-2">Banco de dados indisponível</h1>
          <p className="text-sm text-steel-500 mb-4">O sistema está sendo configurado. Tente novamente em alguns segundos.</p>
          <Link href="/os/login" className="btn-primary">Ir para login</Link>
        </div>
      </div>
    );
  }

  try {
    const [totalCustomers, totalElevators, openOrders, completedOrders, recentOrders] = await Promise.all([
      db.customer.count({ where: { companyId: session.companyId } }),
      db.elevator.count({ where: { companyId: session.companyId } }),
      db.serviceOrder.count({ where: { companyId: session.companyId, status: "DRAFT" } }),
      db.serviceOrder.count({ where: { companyId: session.companyId, status: "COMPLETED" } }),
      db.serviceOrder.findMany({
        where: { companyId: session.companyId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          customer: { select: { name: true } },
          elevator: { select: { identification: true } },
          technician: { select: { name: true } },
        },
      }),
    ]);

    return (
      <div className="min-h-screen bg-steel-50">
        <header className="bg-white border-b border-steel-200 sticky top-0 z-50">
          <div className="container-editorial">
            <div className="flex items-center justify-between h-16 sm:h-14">
              <Link href="/os" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-navy-900 text-lg hidden sm:block">Smart Intech</span>
              </Link>
              <nav className="flex items-center gap-4">
                <Link href="/os" className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors">Dashboard</Link>
                <Link href="/os/clientes" className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors">Clientes</Link>
                <Link href="/os/elevadores" className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors">Elevadores</Link>
                <Link href="/os/ordens" className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors">Ordens</Link>
                <Link href="/os/configuracoes/empresa" className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors">Configurações</Link>
                <form action="/api/os/auth/logout" method="POST">
                  <button type="submit" className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors">Sair</button>
                </form>
              </nav>
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-steel-200 bg-white px-4 py-4 text-center text-xs text-steel-400">
          <p>Smart Intech — Sistema de Ordem de Serviço para Manutenção de Elevadores</p>
        </footer>
      </div>
    );
  } catch (error) {
    console.error("[OS Layout] Database error:", error);
    return (
      <div className="min-h-screen bg-steel-50 flex items-center justify-center p-4">
        <div className="card-editorial max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-navy-950 mb-2">Erro de carregamento</h1>
          <p className="text-sm text-steel-500 mb-4">O sistema está sendo configurado. Tente novamente em alguns segundos.</p>
          <Link href="/os/login" className="btn-primary">Ir para login</Link>
        </div>
      </div>
    );
  }
}
