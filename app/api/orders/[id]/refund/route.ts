import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stablegate } from "@/lib/stablegate/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.number().positive().optional(), // defaults to full refund
  reason: z.string().optional(),
});

/**
 * POST /api/orders/[id]/refund — admin; refunds via the gateway.
 *
 * Docs §4: POST /v1/refunds { payment_id, amount, reason } with an
 * Idempotency-Key. The router path returns a `signingRequest` (EIP-712)
 * that the merchant's payout wallet must sign in the gateway dashboard
 * before the relayer submits it; if the router path is unavailable the
 * gateway answers with mode "manual". Refund state is finalized by the
 * refund.created|succeeded|failed webhooks.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid refund request" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.gatewayPaymentId) {
    return NextResponse.json(
      { error: "No gateway payment recorded for this order (was it paid via StableGate?)" },
      { status: 409 }
    );
  }
  if (order.status !== "PAID" && order.status !== "DELIVERED") {
    return NextResponse.json(
      { error: `Cannot refund an order in status ${order.status}` },
      { status: 409 }
    );
  }
  if (order.refundStatus === "succeeded") {
    return NextResponse.json({ error: "Order already refunded" }, { status: 409 });
  }

  const amount = String(parsed.data.amount ?? Number(order.priceUsdt));

  try {
    const refund = await stablegate.createRefund(
      {
        payment_id: order.gatewayPaymentId,
        amount,
        reason: parsed.data.reason ?? "customer_request",
      },
      { idempotencyKey: `refund-${order.id}` }
    );

    await prisma.order.update({
      where: { id: order.id },
      data: {
        gatewayRefundId: refund.id,
        refundStatus: refund.status ?? "requested",
        refundMode: refund.mode ?? null,
      },
    });

    return NextResponse.json({
      refundId: refund.id,
      status: refund.status ?? "requested",
      mode: refund.mode ?? "router",
      amount,
      // When true: the merchant completes the payout-wallet signature in the
      // gateway dashboard (POST /v1/refunds/:id/authorize happens there).
      needsSignature: Boolean(refund.signingRequest),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refund failed";
    console.error(`[stablegate] Refund failed for order ${order.id}:`, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
