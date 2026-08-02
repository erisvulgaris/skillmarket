export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getErrorStats } from "@/lib/api";

export async function GET() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  const start = performance.now();

  let dbAlive = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbAlive = true;
  } catch {
    dbAlive = false;
  }

  const elapsed = performance.now() - start;

  return NextResponse.json(
    {
      status: dbAlive ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.0.0",
      db: dbAlive,
      uptime: process.uptime(),
      errors: process.env.NODE_ENV !== 'production' ? getErrorStats() : undefined,
    },
    {
      headers: {
        "X-Response-Time": `${elapsed.toFixed(0)}ms`,
      },
    }
  );
}
