import { NextResponse } from "next/server";
import { getSession } from "@/lib/os-session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      session: null
    }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      name: session.name,
      role: session.role,
      companyId: session.companyId
    },
    session: session
  });
}