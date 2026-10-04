import { NextResponse } from "next/server";
import { db, isDbAvailable } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "set" : "MISSING",
      AUTH_SECRET: process.env.AUTH_SECRET ? "set" : "MISSING",
      OS_BOOTSTRAP_SECRET: process.env.OS_BOOTSTRAP_SECRET ? "set" : "MISSING",
      APP_URL: process.env.APP_URL || "not set",
    },
    database: "unavailable",
    prisma: "unavailable",
  };

  // Só testa se DB estiver disponível
  if (isDbAvailable()) {
    try {
      await db.$queryRaw`SELECT 1`;
      checks.database = "connected";
    } catch (error) {
      checks.database = `error: ${error instanceof Error ? error.message : "unknown"}`;
    }

    try {
      const userCount = await db.user.count();
      checks.prisma = `ok (${userCount} users)`;
    } catch (error) {
      checks.prisma = `error: ${error instanceof Error ? error.message : "unknown"}`;
    }
  } else {
    checks.database = "DATABASE_URL not configured";
    checks.prisma = "DATABASE_URL not configured";
  }

  const allOk = checks.database === "connected" && checks.prisma.startsWith("ok");
  return NextResponse.json(checks, { status: allOk ? 200 : 503 });
}
