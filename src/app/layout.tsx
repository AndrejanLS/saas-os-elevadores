import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0c1a2b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Smart Intech — Ordem de Serviço para Manutenção de Elevadores",
  description: "Sistema profissional para empresas de manutenção de elevadores. Gestão de clientes, elevadores, ordens de serviço e geração de PDF.",
  keywords: ["elevadores", "manutenção de elevadores", "ordem de serviço", "OS elevadores", "gestão de manutenção"],
  authors: [{ name: "Smart Intech" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "http://localhost:3000",
    title: "Smart Intech — Ordem de Serviço para Manutenção de Elevadores",
    description: "Sistema profissional para empresas de manutenção de elevadores.",
    siteName: "Smart Intech",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Intech",
    description: "Sistema profissional para empresas de manutenção de elevadores.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-steel-50 text-navy-900">
        {children}
      </body>
    </html>
  );
}