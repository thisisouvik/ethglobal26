import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyStableGateSignature,
  parseStableGateEvent,
  paymentTxHash,
} from "@/lib/stablegate/webhook";
import type { GatewayPayment, GatewayRefund } from "@/lib/stablegate/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stablegate
 *
 * Receiver for StableGate gateway webhooks (docs 05-API-AND-SDK.md §3).
 * Register this URL in the gateway dashboard under Developers → Webhooks.
 *
 * Contract implemented here:
 *  - `StableGate-Signature: t=<unix>,v1=<hmac_sha256(secret, t + "." + body)>`
 *    verified against the raw body, rejected when older than 300s.
 *  - Dedupe on the event `id` (the gateway retries with backoff for 24h).
 *  - Always answer 2xx quickly for accepted/duplicate events; non-2xx makes
 *    the gateway retry, which is reserved for transient local failures.
 *
 * Events handled:
 *  - payment.succeeded / invoice.paid → order PAID (fulfilment)
 *  - payment.failed / payment.expired → order FAILED
 *  - refund.created / refund.succeeded / refund.failed → refund tracking
 *    (refund.succeeded also marks the order REFUNDED)
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  const secret = process.env.STABLEGATE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stablegate-webhook] STABLEGATE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Receiver not configured" }, { status: 500 });
  }

  const verification = verifyStableGateSignature(
    rawBody,
    req.headers.get("stablegate-signature"),
    secret
  );
  if (!verification.valid) {
    console.warn(`[stablegate-webhook] Rejected: ${verification.reason}`);
    return NextResponse.json({ error: verification.reason }, { status: 401 });
  }

  const event = parseStableGateEvent(rawBody);
  if (!event) {
    return NextResponse.json({ error: "Invalid event envelope" }, { status: 400 });
  }

  // ── Dedupe on the gateway event id ──────────────────────────────────
  try {
    await prisma.stableGateEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: event as object,
      },
    });
  } catch {
    // Unique violation → already processed. Ack so the gateway stops retrying.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "payment.succeeded":
      case "invoice.paid":
        await handlePaymentSucceeded(event.data.payment);
        break;

      case "payment.failed":
      case "payment.expired":
        await handleTerminalFailure(event);
        break;

      case "refund.created":
      case "refund.succeeded":
      case "refund.failed":
        await handleRefundEvent(event.type, event.data.refund);
        break;

      default:
        // payment.created/pending, fulfilment.updated, x402.settled,
        // exception.created, … — stored for audit, no state change needed.
        console.log(`[stablegate-webhook] Ignored event ${event.type} (${event.id})`);
    }
  } catch (err) {
    console.error(`[stablegate-webhook] Handler error for ${event.type}:`, err);
    // 500 → the gateway will retry this event later (dedupe row exists but
    // our own processing failed, so allow a re-delivery path by deleting it).
    await prisma.stableGateEvent.delete({ where: { id: event.id } }).catch(() => {});
    return NextResponse.json({ error: "Handler failure" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Find the order for a gateway payment by intent id, reference or payment id. */
async function findOrderForPayment(payment?: GatewayPayment) {
  if (!payment) return null;
  return (
    (payment.intent_id
      ? await prisma.order.findUnique({ where: { gatewayIntentId: payment.intent_id } })
      : null) ??
    (payment.reference
      ? await prisma.order.findUnique({ where: { id: payment.reference } })
      : null) ??
    (payment.id
      ? await prisma.order.findUnique({ where: { gatewayPaymentId: payment.id } })
      : null)
  );
}

async function handlePaymentSucceeded(payment?: GatewayPayment) {
  const order = await findOrderForPayment(payment);
  if (!order) {
    console.warn("[stablegate-webhook] payment.succeeded for unknown order — stored for audit");
    return;
  }

  // `succeeded` never regresses (docs 02-ARCHITECTURE.md §9)
  if (order.status === "PAID" || order.status === "DELIVERED") return;
  if (order.status === "REFUNDED") return;

  const txHash = paymentTxHash(payment ?? {});
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      gatewayStatus: "succeeded",
      gatewayPaymentId: payment?.id ?? order.gatewayPaymentId,
      ...(txHash ? { paymentTxHash: txHash } : {}),
      webhookData: { payment } as object,
    },
  });
  console.log(`[stablegate-webhook] Order ${order.id} PAID (payment ${payment?.id}, tx ${txHash ?? "?"})`);
}

async function handleTerminalFailure(event: { id: string; type: string }) {
  // Failure events carry the payment the same way as success events.
  // Re-parse from the stored payload to keep one shape.
  const stored = await prisma.stableGateEvent.findUnique({ where: { id: event.id } });
  const payment = stored?.payload
    ? ((stored.payload as { data?: { payment?: GatewayPayment } }).data?.payment ?? undefined)
    : undefined;

  const order = await findOrderForPayment(payment);
  if (!order || order.status !== "PENDING") return;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "FAILED",
      gatewayStatus: event.type === "payment.expired" ? "expired" : "failed",
      webhookData: { payment } as object,
    },
  });
  console.log(`[stablegate-webhook] Order ${order.id} FAILED (${event.type})`);
}

async function handleRefundEvent(type: string, refund?: GatewayRefund) {
  if (!refund) return;

  const order =
    (refund.payment_id
      ? await prisma.order.findUnique({ where: { gatewayPaymentId: refund.payment_id } })
      : null) ??
    (refund.id
      ? await prisma.order.findFirst({ where: { gatewayRefundId: refund.id } })
      : null);

  if (!order) {
    console.warn(`[stablegate-webhook] ${type} for unknown order — stored for audit`);
    return;
  }

  const refundStatus =
    type === "refund.succeeded" ? "succeeded" : type === "refund.failed" ? "failed" : "requested";

  await prisma.order.update({
    where: { id: order.id },
    data: {
      gatewayRefundId: refund.id,
      refundStatus,
      refundMode: refund.mode ?? order.refundMode,
      // Full-refund marker: on refund.succeeded mark the order refunded.
      ...(type === "refund.succeeded" && order.status !== "FAILED"
        ? { status: "REFUNDED" as const }
        : {}),
    },
  });
  console.log(`[stablegate-webhook] Refund ${refund.id} → ${refundStatus} (order ${order.id})`);
}
