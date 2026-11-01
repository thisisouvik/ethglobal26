import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureOrderIntent } from "@/lib/stablegate/orders";
import { stablegate } from "@/lib/stablegate/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/intent
 *
 * Create-or-get the StableGate payment intent for an order. Used by the pay
 * page when the order exists but no intent does (e.g. the gateway was
 * unreachable when the order was placed). Idempotent: one intent per order.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({
      intentId: order.gatewayIntentId,
      checkoutUrl: order.gatewayCheckoutUrl,
      status: order.status,
    });
  }
  if (!stablegate.configured) {
    return NextResponse.json(
      { error: "Gateway not configured (missing STABLEGATE_SECRET_KEY)" },
      { status: 503 }
    );
  }

  const result = await ensureOrderIntent(order);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Intent creation failed" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    intentId: result.intentId,
    checkoutUrl: result.checkoutUrl ?? null,
    status: order.status,
  });
}
