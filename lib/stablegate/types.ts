/**
 * Types for the StableGate gateway API.
 *
 * Source: gateway documentation (gateway-docs/docs/05-API-AND-SDK.md,
 * 02-ARCHITECTURE.md §9 state machines, 03-DATA-MODEL.md).
 * Field names follow the documented API; anything the docs leave open is
 * typed defensively as optional.
 */

/** GET /v1/capabilities — network, token, decimals, feature flags. */
export interface StableGateCapabilities {
  network?: string;
  networkName?: string;
  chainId?: number;
  token?: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  decimals?: number;
  features?: Record<string, boolean> | string[];
  [key: string]: unknown;
}

/**
 * POST /v1/payment-intents request.
 * `amount` is a human decimal string ("49.00"); the client converts it to
 * token base units using the token decimals from /v1/capabilities.
 */
export interface PaymentIntentCreateParams {
  amount: string;
  currency: "USDT";
  /** Merchant-side reference — we use our order id. */
  reference: string;
  description?: string;
  customer?: { email?: string };
  /** Seconds until the intent expires. */
  expires_in?: number;
  /** Endpoint the gateway's CRE fulfilment workflow polls after payment. */
  fulfilment?: { url: string };
}

/**
 * Payment intent (created + retrieved).
 * State machine (architecture doc §9):
 * created → requires_authorization → authorized → submitted →
 * pending_confirmation → succeeded | failed | expired
 * succeeded → partially_refunded | refunded
 */
export interface PaymentIntent {
  id: string;
  status: string;
  checkoutUrl?: string;
  clientSecret?: string;
  amount?: string;
  currency?: string;
  reference?: string;
  expiresAt?: string;
  invoice?: {
    payload?: Record<string, unknown>;
    signature?: string;
    keyId?: string;
  };
  [key: string]: unknown;
}

/** Payment object as it appears in webhook `data.payment`. */
export interface GatewayPayment {
  id: string; // pay_…
  intent_id?: string;
  merchant_id?: string;
  payer?: string;
  /** Base-unit string per the data model (numeric(78,0) exposed as string). */
  amount?: string;
  refunded_amount?: string;
  tx_id?: string;
  tx_hash?: string;
  reference?: string;
  status?: string;
  succeeded_at?: string;
  source?: "checkout" | "link" | "x402";
  [key: string]: unknown;
}

/** Refund object as it appears in webhook `data.refund`. */
export interface GatewayRefund {
  id: string; // re_…
  payment_id?: string;
  amount?: string;
  reason?: string;
  mode?: "router" | "manual";
  status?: string;
  [key: string]: unknown;
}

/** POST /v1/refunds response — may require a payout-wallet signature. */
export interface RefundResult extends GatewayRefund {
  /** Present when the router path is used: EIP-712 typed data the merchant
   * payout wallet must sign, then POST /v1/refunds/:id/authorize. */
  signingRequest?: Record<string, unknown>;
}

/** Webhook envelope (docs §3). */
export interface StableGateEvent {
  id: string; // evt_… — consumers dedupe on this
  type: StableGateEventType | string;
  created: string;
  merchant_id: string;
  api_version: string;
  data: {
    payment?: GatewayPayment;
    refund?: GatewayRefund;
    [key: string]: unknown;
  };
}

export type StableGateEventType =
  | "payment.created"
  | "payment.pending"
  | "payment.succeeded"
  | "payment.failed"
  | "payment.expired"
  | "payment.underpaid"
  | "payment.overpaid"
  | "payment.duplicate_detected"
  | "refund.created"
  | "refund.succeeded"
  | "refund.failed"
  | "invoice.paid"
  | "fulfilment.updated"
  | "x402.settled"
  | "exception.created";

/** Stable error shape (docs §1). */
export interface StableGateErrorBody {
  error: {
    code: string;
    message: string;
    request_id?: string;
    details?: Record<string, unknown>;
  };
}
