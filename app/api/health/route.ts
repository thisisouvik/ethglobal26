import { NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { stablegate } from "@/lib/stablegate/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — liveness + DB connectivity probe.
 * Used by CI smoke tests and post-deployment checks. Returns 200 only when
 * the app can actually reach the database; 503 otherwise.
 */
export async function GET() {
  const started = Date.now();
  try {
    const courseCount = await withDbRetry(() =>
      prisma.course.count({ where: { published: true } })
    );
    return NextResponse.json({
      status: "ok",
      database: { ok: true, publishedCourses: courseCount },
      gateway: { configured: stablegate.configured },
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        database: { ok: false },
        gateway: { configured: stablegate.configured },
        error: err instanceof Error ? err.message : "Database unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
