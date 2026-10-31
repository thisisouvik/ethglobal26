import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhook/whitechain
 *
 * WhiteChain calls this endpoint when a USDT payment is detected.
 * Expected payload (adapt to your actual WhiteChain gateway format):
 * {
 *   orderId: string,          // the order ID we passed to the gateway
 *   txHash: string,           // transaction hash on WhiteChain
 *   amount: string,           // amount in USDT
 *   status: "confirmed" | "failed",
 *   signature: string         // HMAC-SHA256 of payload with WHITECHAIN_WEBHOOK_SECRET
 * }
 */
export async function POST(req: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  // ─── Signature verification ───────────────────────────────────────────
  const secret = process.env.WHITECHAIN_WEBHOOK_SECRET;
  const sigHeader = req.headers.get("x-whitechain-signature") ?? req.headers.get("x-signature");

  if (secret && sigHeader) {
    const expected = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    // Constant-time comparison
    if (!timingSafeEqual(expected, sigHeader)) {
      console.warn("[webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (secret && !sigHeader) {
    // Enforce signature verification in production
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
  }

  // ─── Parse payload ─────────────────────────────────────────────────────
  let payload: {
    orderId?: string;
    txHash?: string;
    amount?: string;
    status?: string;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId, txHash, amount, status } = payload;

  if (!orderId || !txHash) {
    return NextResponse.json({ error: "Missing orderId or txHash" }, { status: 400 });
  }

  // ─── Find order ────────────────────────────────────────────────────────
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    // Return 200 so WhiteChain does not keep retrying for unknown orders
    return NextResponse.json({ received: true, note: "Order not found" });
  }

  if (order.status !== "PENDING") {
    // Already processed — idempotent
    return NextResponse.json({ received: true, note: "Already processed" });
  }

  // ─── Verify amount ─────────────────────────────────────────────────────
  const expectedAmount = Number(order.priceUsdt);
  const receivedAmount = Number(amount ?? 0);

  if (status === "failed" || status === "FAILED") {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "FAILED",
        paymentTxHash: txHash,
        webhookData: payload as object,
      },
    });
    return NextResponse.json({ received: true });
  }

  if (receivedAmount < expectedAmount) {
    console.warn(
      `[webhook] Underpayment: expected ${expectedAmount}, got ${receivedAmount} for order ${orderId}`
    );
    // Don't mark as paid, but log it
    await prisma.order.update({
      where: { id: orderId },
      data: { webhookData: { ...payload, note: "underpayment" } as object },
    });
    return NextResponse.json({ received: true, note: "Underpayment logged" });
  }

  // ─── Mark order as PAID ────────────────────────────────────────────────
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paymentTxHash: txHash,
      webhookData: payload as object,
    },
  });

  console.log(`[webhook] Order ${orderId} marked PAID — tx: ${txHash}`);

  return NextResponse.json({ received: true });
}

/** Timing-safe string comparison */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

