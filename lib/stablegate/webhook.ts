/**
 * StableGate webhook signature verification.
 *
 * Source: gateway documentation, docs/05-API-AND-SDK.md §3.
 *  - Header: `StableGate-Signature: t=<unix>,v1=<hex hmac_sha256(secret, t + "." + body)>`
 *  - Reject if |now − t| > 300 seconds.
 *  - Consumers must dedupe on the event `id` (the gateway retries with
 *    exponential backoff for up to 24h).
 */

import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from "crypto";
import { StableGateEvent } from "./types";

export const WEBHOOK_TOLERANCE_SECONDS = 300;

export interface VerificationResult {
  valid: boolean;
  reason?: string;
}

/** Timing-safe comparison of two hex strings. */
function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a.toLowerCase(), "utf8");
  const bufB = Buffer.from(b.toLowerCase(), "utf8");
  if (bufA.length !== bufB.length) return false;
  return nodeTimingSafeEqual(bufA, bufB);
}

/**
 * Verify the `StableGate-Signature` header against the raw request body.
 * The signed material is `<t>.<rawBody>` — the timestamp must be part of
 * the MAC, so a captured signature cannot be replayed with a new body.
 */
export function verifyStableGateSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  opts: { toleranceSeconds?: number; now?: number } = {}
): VerificationResult {
  if (!signatureHeader) {
    return { valid: false, reason: "missing_signature_header" };
  }

  // Parse "t=<unix>,v1=<hex>" (accept multiple v1= entries, Stripe-style)
  let timestamp: string | undefined;
  const v1s: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [k, ...rest] = part.trim().split("=");
    const value = rest.join("=");
    if (k === "t") timestamp = value;
    else if (k === "v1" && value) v1s.push(value);
  }

  if (!timestamp || v1s.length === 0) {
    return { valid: false, reason: "malformed_signature_header" };
  }

  const tolerance = opts.toleranceSeconds ?? WEBHOOK_TOLERANCE_SECONDS;
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const age = Math.abs(now - Number(timestamp));
  if (!Number.isFinite(age) || age > tolerance) {
    return { valid: false, reason: "timestamp_out_of_tolerance" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const matches = v1s.some((v1) => safeEqualHex(expected, v1));
  if (!matches) {
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true };
}

/** Parse and minimally validate the webhook envelope. */
export function parseStableGateEvent(rawBody: string): StableGateEvent | null {
  try {
    const evt = JSON.parse(rawBody) as StableGateEvent;
    if (typeof evt?.id !== "string" || typeof evt?.type !== "string") {
      return null;
    }
    return evt;
  } catch {
    return null;
  }
}

/** Extract a tx hash from a gateway payment object (field name varies). */
export function paymentTxHash(payment: { tx_id?: string; tx_hash?: string; [k: string]: unknown }): string | null {
  return (
    payment.tx_id ??
    payment.tx_hash ??
    (typeof payment.tx === "string" ? payment.tx : null) ??
    null
  );
}
