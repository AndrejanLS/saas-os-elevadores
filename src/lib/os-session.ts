import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, type Session } from "@/lib/os-auth";

export const SESSION_COOKIE = "saas_os_elevadores_session";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/os/login");
  return session;
}

export function canManageCatalog(role: Session["role"]) {
  return role === "ADMIN" || role === "SUPERVISOR";
}