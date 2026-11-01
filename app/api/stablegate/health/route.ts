import { NextResponse } from "next/server";
import { stablegate } from "@/lib/stablegate/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/stablegate/health
 *
 * Readiness probe for the StableGate integration: proxies
 * GET /v1/capabilities (network, token, decimals, feature flags —
 * docs 05-API-AND-SDK.md §2).
 */
export async function GET() {
  if (!stablegate.configured) {
    return NextResponse.json(
      { connected: false, configured: false, error: "STABLEGATE_SECRET_KEY is not set" },
      { status: 200 }
    );
  }

  try {
    const capabilities = await stablegate.getCapabilities(true);
    return NextResponse.json({
      connected: true,
      configured: true,
      capabilities,
    });
  } catch (err) {
    return NextResponse.json(
      {
        connected: false,
        configured: true,
        error: err instanceof Error ? err.message : "Gateway unreachable",
      },
      { status: 200 }
    );
  }
}
