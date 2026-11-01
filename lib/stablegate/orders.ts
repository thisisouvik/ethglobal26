/**
 * Glue between the app's Order model and the StableGate gateway.
 *
 * Follows the gateway integration rules from the docs:
 *  - Intents are created server-to-server with the merchant secret key and
 *    an Idempotency-Key (docs §5 "the 20 lines" merchant-server pattern).
 *  - Order fulfilment is driven by webhooks or by server-side
 *    `paymentIntents.retrieve()` — never by browser callbacks.
 *  - `fulfilment.url` is passed so the gateway's CRE workflow can check
 *    delivery after payment (docs 02-ARCHITECTURE.md Flow D).
 */

import { prisma } from "@/lib/prisma";
import { stablegate, StableGateError } from "./client";
import { paymentTxHash } from "./webhook";
import { GatewayPayment } from "./types";

/** Checkout intents expire with the on-page 30-minute countdown. */
const INTENT_EXPIRES_IN_SECONDS = 30 * 60;

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

type OrderWithGatewayFields = {
  id: string;
  email: string;
  courseName: string;
  priceUsdt: { toString(): string };
  status: string;
  gatewayIntentId: string | null;
  gatewayPaymentId: string | null;
  gatewayStatus: string | null;
  gatewayCheckoutUrl: string | null;
};

export interface EnsureIntentResult {
  ok: boolean;
  intentId?: string;
  checkoutUrl?: string | null;
  error?: string;
}

/**
 * Create the gateway payment intent for an order (idempotent).
 * Safe to retry: one intent per order, Idempotency-Key derived from the
 * order id, so a retried request returns the same intent (docs §1).
 */
export async function ensureOrderIntent(
  order: OrderWithGatewayFields
): Promise<EnsureIntentResult> {
  if (order.gatewayIntentId) {
    return {
      ok: true,
      intentId: order.gatewayIntentId,
      checkoutUrl: order.gatewayCheckoutUrl,
    };
  }

  try {
    const intent = await stablegate.createPaymentIntent(
      {
        amount: order.priceUsdt.toString(), // e.g. "49.00" — client converts to base units
        currency: "USDT",
        reference: order.id,
        description: `Course enrollment: ${order.courseName}`,
        customer: { email: order.email },
        expires_in: INTENT_EXPIRES_IN_SECONDS,
        fulfilment: {
          url: `${appUrl()}/api/orders/${order.id}/fulfilment-status`,
        },
      },
      { idempotencyKey: `order-${order.id}-intent` }
    );

    await prisma.order.update({
      where: { id: order.id },
      data: {
        gatewayIntentId: intent.id,
        gatewayStatus: intent.status,
        gatewayCheckoutUrl: intent.checkoutUrl ?? null,
      },
    });

    return {
      ok: true,
      intentId: intent.id,
      checkoutUrl: intent.checkoutUrl ?? null,
    };
  } catch (err) {
    const message =
      err instanceof StableGateError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Unknown gateway error";
    console.error(`[stablegate] Intent creation failed for order ${order.id}: ${message}`);
    return { ok: false, error: message };
  }
}

/**
 * Map a gateway intent status (architecture doc §9) to our OrderStatus.
 * `succeeded` never regresses, and neither do we.
 */
export function mapIntentStatus(intentStatus: string): {
  orderStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
} {
  switch (intentStatus) {
    case "succeeded":
    case "partially_refunded":
      return { orderStatus: "PAID" };
    case "refunded":
      return { orderStatus: "REFUNDED" };
    case "failed":
    case "expired":
      return { orderStatus: "FAILED" };
    default:
      // created / requires_authorization / authorized / submitted /
      // pending_confirmation — still waiting on the payer/chain
      return { orderStatus: "PENDING" };
  }
}

export interface SyncResult {
  changed: boolean;
  orderStatus: string;
  gatewayStatus?: string;
}

/**
 * Reconcile a PENDING order against the authoritative gateway status
 * (`GET /v1/payment-intents/:id`). Used as a safety net when polling, so a
 * missed webhook never leaves a paid order stuck (docs: clients poll or use
 * webhooks; retrieve is authoritative).
 */
export async function syncOrderFromGateway(
  order: OrderWithGatewayFields & { gatewayRefundId?: string | null; refundStatus?: string | null }
): Promise<SyncResult> {
  if (!order.gatewayIntentId) {
    return { changed: false, orderStatus: order.status };
  }

  // Terminal states are final — nothing to sync.
  if (order.status !== "PENDING") {
    return { changed: false, orderStatus: order.status, gatewayStatus: order.gatewayStatus ?? undefined };
  }

  let intent: { id: string; status: string; [k: string]: unknown };
  try {
    intent = await stablegate.retrievePaymentIntent(order.gatewayIntentId);
  } catch (err) {
    // Gateway unreachable — keep the local state; webhook remains the driver.
    console.warn(
      `[stablegate] Status sync skipped for order ${order.id}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return { changed: false, orderStatus: order.status, gatewayStatus: order.gatewayStatus ?? undefined };
  }

  const { orderStatus } = mapIntentStatus(intent.status);

  if (orderStatus === "PENDING") {
    if (intent.status !== order.gatewayStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: { gatewayStatus: intent.status },
      });
      return { changed: true, orderStatus, gatewayStatus: intent.status };
    }
    return { changed: false, orderStatus, gatewayStatus: intent.status };
  }

  if (orderStatus === "PAID") {
    // Observed succeeded on-chain (observer-confirmed before the gateway
    // reports it) — fulfil directly from the authoritative retrieve.
    const payment = (intent as { payment?: GatewayPayment }).payment;
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        gatewayStatus: intent.status,
        ...(payment?.id ? { gatewayPaymentId: payment.id } : {}),
        ...(paymentTxHash(payment ?? {}) ? { paymentTxHash: paymentTxHash(payment!) } : {}),
      },
    });
    console.log(`[stablegate] Order ${order.id} marked PAID via retrieve (${intent.id})`);
    return { changed: true, orderStatus, gatewayStatus: intent.status };
  }

  // FAILED / REFUNDED terminal mapping
  const finalStatus = orderStatus ?? "FAILED";
  await prisma.order.update({
    where: { id: order.id },
    data: { status: finalStatus, gatewayStatus: intent.status },
  });
  return { changed: true, orderStatus: finalStatus, gatewayStatus: intent.status };
}
