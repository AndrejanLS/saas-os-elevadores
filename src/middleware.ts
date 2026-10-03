import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MASTER_KEY = process.env.MASTER_ACCESS_KEY;
const SESSION_COOKIE = "saas_os_elevadores_session";
const ACCESS_COOKIE = "master_access_granted";

export function middleware(request: NextRequest) {
  // Se não tem MASTER_KEY configurado, deixa passar (dev local sem senha mestre)
  if (!MASTER_KEY) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Só protege rotas /os/*
  if (!pathname.startsWith("/os")) return NextResponse.next();

  // Se já tem cookie de sessão válida, deixa passar
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  if (sessionCookie) return NextResponse.next();

  // Se está na página de login
  if (pathname === "/os/login") {
    // Se tem a chave na query (?key=xxx), valida e seta cookie de acesso
    const key = request.nextUrl.searchParams.get("key");
    if (key === MASTER_KEY) {
      const response = NextResponse.next();
      response.cookies.set(ACCESS_COOKIE, "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 hora
      });
      return response;
    }
    // Se tem cookie de acesso concedido, permite
    const granted = request.cookies.get(ACCESS_COOKIE);
    if (granted?.value === "true") return NextResponse.next();

    // Senão redireciona pra página de chave
    const url = request.nextUrl.clone();
    url.pathname = "/os/access-key";
    url.searchParams.delete("key");
    return NextResponse.redirect(url);
  }

  // Se está na página de chave de acesso, permite (evita loop)
  if (pathname === "/os/access-key") return NextResponse.next();

  // Outras rotas /os/* sem sessão -> redirect login
  const url = request.nextUrl.clone();
  url.pathname = "/os/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/os/:path*"],
};