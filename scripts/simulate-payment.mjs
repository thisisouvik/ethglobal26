#!/usr/bin/env node
/**
 * Simulates StableGate gateway webhooks against your local app, so you can
 * manually test the full order lifecycle without the gateway API running.
 *
 * It sends exactly what the real gateway sends per the docs
 * (gateway-docs/docs/05-API-AND-SDK.md §3): a JSON event envelope with a
 * `StableGate-Signature: t=<unix>,v1=<hmac_sha256(secret, t + "." + body)>`
 * header signed with your STABLEGATE_WEBHOOK_SECRET.
 *
 * Usage (from the ethglobal26 folder, app running):
 *   node scripts/simulate-payment.mjs <orderId>              mark order PAID
 *   node scripts/simulate-payment.mjs <orderId> --expired    mark FAILED (window expired)
 *   node scripts/simulate-payment.mjs <orderId> --failed     mark FAILED
 *   node scripts/simulate-payment.mjs <orderId> --refund     simulate refund.succeeded
 *
 * The order id is in the pay page URL: /pay/<orderId>
 */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env reader (no dependency)
const env = {};
for (const line of readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const APP_URL = (
  process.env.APP_URL ||
  env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");
const SECRET = process.env.STABLEGATE_WEBHOOK_SECRET || env.STABLEGATE_WEBHOOK_SECRET;

if (!SECRET) {
  console.error("STABLEGATE_WEBHOOK_SECRET is not set in .env — add any string value first.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const orderId = argv.find((a) => !a.startsWith("--"));
const mode = argv.includes("--expired")
  ? "expired"
  : argv.includes("--failed")
    ? "failed"
    : argv.includes("--refund")
      ? "refund"
      : "succeeded";

if (!orderId) {
  console.error(
    "Usage: node scripts/simulate-payment.mjs <orderId> [--expired|--failed|--refund]\n" +
      "The order id is in the pay page URL: /pay/<orderId>"
  );
  process.exit(1);
}

// ── Look up the order so the simulated payment matches it ──────────────
const orderRes = await fetch(`${APP_URL}/api/orders/${orderId}`);
if (!orderRes.ok) {
  console.error(`Order ${orderId} not found (HTTP ${orderRes.status}) — is the app running at ${APP_URL}?`);
  process.exit(1);
}
const order = await orderRes.json();

const DECIMALS = 6; // USDT decimals per the gateway docs
const baseUnits = BigInt(Math.round(Number(order.priceUsdt) * 10 ** DECIMALS)).toString();
const payId = order.gatewayPaymentId || `pay_sim_${orderId.slice(-8)}`;
const intentId = order.gatewayIntentId || `pi_sim_${orderId.slice(-8)}`;
const txHash = order.paymentTxHash || `0xsim${Math.random().toString(16).slice(2, 12)}`;

const payment = {
  id: payId,
  intent_id: intentId,
  merchant_id: "mer_sim",
  reference: order.id,
  amount: baseUnits,
  payer: "0x82BDe0d470951DD1804Cc9E18746e49F0d0ce073",
  tx_id: txHash,
  status: "succeeded",
  source: "checkout",
};

let type;
let data;
if (mode === "refund") {
  if (!order.gatewayPaymentId) {
    console.error("This order has no gateway payment yet — run the succeeded simulation first.");
    process.exit(1);
  }
  type = "refund.succeeded";
  data = {
    refund: {
      id: `re_sim_${orderId.slice(-8)}`,
      payment_id: order.gatewayPaymentId,
      amount: baseUnits,
      mode: "manual",
      status: "succeeded",
    },
  };
} else if (mode === "expired" || mode === "failed") {
  type = mode === "expired" ? "payment.expired" : "payment.failed";
  data = { payment };
} else {
  type = "payment.succeeded";
  data = { payment };
}

const event = {
  id: `evt_sim_${type}_${Date.now()}`,
  type,
  created: new Date().toISOString(),
  merchant_id: "mer_sim",
  api_version: "2026-10-01",
  data,
};

// ── Sign and deliver (docs §3: hmac_sha256(secret, t + "." + body)) ────
const body = JSON.stringify(event);
const t = Math.floor(Date.now() / 1000);
const v1 = createHmac("sha256", SECRET).update(`${t}.${body}`).digest("hex");

const res = await fetch(`${APP_URL}/api/webhooks/stablegate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "StableGate-Signature": `t=${t},v1=${v1}`,
  },
  body,
});
const json = await res.json().catch(() => ({}));

if (res.ok && json.duplicate) {
  console.log(`= ${type} already processed before (dedupe worked) — order unchanged.`);
} else if (res.ok) {
  console.log(`✓ ${type} delivered for order ${orderId}`);
  if (mode === "succeeded") {
    console.log(`  → Watch the open /pay/${orderId} tab flip to the success page within ~5s.`);
  }
} else {
  console.error(`✗ Delivery failed: HTTP ${res.status} ${JSON.stringify(json)}`);
  process.exit(1);
}
