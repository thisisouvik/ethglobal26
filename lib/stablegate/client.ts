/**
 * Server-side client for the StableGate gateway REST API.
 *
 * Source: gateway documentation, docs/05-API-AND-SDK.md.
 *  - Base URL (dev): http://localhost:4000, versioned under /v1, JSON.
 *  - Auth: `Authorization: Bearer sk_test_…` (server secret key).
 *  - Idempotency: every POST accepts an `Idempotency-Key` header.
 *  - Amounts: strings in token base units in the API; we convert human
 *    decimals ("49.00") using the token decimals from GET /v1/capabilities.
 *  - Errors: stable shape `{ error: { code, message, request_id, details } }`.
 *
 * Server-only: never import this from a client component; the secret key
 * must stay on the server.
 */

import {
  StableGateCapabilities,
  PaymentIntent,
  PaymentIntentCreateParams,
  RefundResult,
} from "./types";

export class StableGateError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string = "gateway_error",
    public readonly requestId?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "StableGateError";
  }
}

export interface StableGateClientOptions {
  baseUrl?: string;
  secretKey?: string;
}

const CAPABILITIES_TTL_MS = 5 * 60 * 1000;

export class StableGateClient {
  private readonly baseUrl: string;
  private readonly secretKey?: string;
  private capabilitiesCache?: {
    data: StableGateCapabilities;
    at: number;
  };

  constructor(opts: StableGateClientOptions = {}) {
    this.baseUrl = (
      opts.baseUrl ??
      process.env.STABLEGATE_API_URL ??
      "http://localhost:4000"
    ).replace(/\/+$/, "");
    this.secretKey = opts.secretKey ?? process.env.STABLEGATE_SECRET_KEY;
  }

  /** True when a secret key is configured (gateway integration enabled). */
  get configured(): boolean {
    return (
      typeof this.secretKey === "string" &&
      this.secretKey.length > 0 &&
      !this.secretKey.includes("placeholder")
    );
  }

  // ── Low-level request helper ──────────────────────────────────────────

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    opts: { body?: unknown; idempotencyKey?: string } = {}
  ): Promise<T> {
    if (!this.configured) {
      throw new StableGateError(
        "STABLEGATE_SECRET_KEY is not configured",
        0,
        "not_configured"
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
    if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      throw new StableGateError(
        `Cannot reach StableGate gateway at ${this.baseUrl}: ${
          err instanceof Error ? err.message : String(err)
        }`,
        0,
        "gateway_unreachable"
      );
    }

    if (!res.ok) {
      let code = `http_${res.status}`;
      let message = `StableGate API ${method} ${path} failed with ${res.status}`;
      let requestId: string | undefined;
      let details: unknown;
      try {
        const parsed = (await res.json()) as {
          error?: { code?: string; message?: string; request_id?: string; details?: unknown };
        };
        if (parsed.error) {
          code = parsed.error.code ?? code;
          message = parsed.error.message ?? message;
          requestId = parsed.error.request_id;
          details = parsed.error.details;
        }
      } catch {
        // non-JSON error body — keep the HTTP-level message
      }
      throw new StableGateError(message, res.status, code, requestId, details);
    }

    return (await res.json()) as T;
  }

  // ── Capabilities & amount conversion ─────────────────────────────────

  /** GET /v1/capabilities — network, token, decimals, feature flags. */
  async getCapabilities(forceRefresh = false): Promise<StableGateCapabilities> {
    if (
      !forceRefresh &&
      this.capabilitiesCache &&
      Date.now() - this.capabilitiesCache.at < CAPABILITIES_TTL_MS
    ) {
      return this.capabilitiesCache.data;
    }
    const data = await this.request<StableGateCapabilities>("GET", "/v1/capabilities");
    this.capabilitiesCache = { data, at: Date.now() };
    return data;
  }

  /** USDT decimals per the gateway (falls back to 6, the USDT standard). */
  async getTokenDecimals(): Promise<number> {
    try {
      const caps = await this.getCapabilities();
      const d = caps.decimals;
      return typeof d === "number" ? d : 6;
    } catch {
      return 6;
    }
  }

  /**
   * Convert a human decimal amount ("49.00") to token base units ("49000000").
   * The API takes base-unit strings; this mirrors what @stablegate/sdk does
   * for its callers (docs §1: "the SDK also accepts human decimals").
   */
  static toBaseUnits(amount: string | number, decimals: number): string {
    const raw = String(amount).trim().replace(/,/g, "");
    if (!/^\d+(\.\d+)?$/.test(raw)) {
      throw new StableGateError(
        `Invalid amount "${amount}" — expected a non-negative decimal like "49.00"`,
        0,
        "validation_error"
      );
    }
    const [int = "0", frac = ""] = raw.split(".");
    if (frac.length > decimals) {
      throw new StableGateError(
        `Amount "${amount}" has more precision than ${decimals} token decimals`,
        0,
        "validation_error"
      );
    }
    const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
    const digits = `${int}${padded}`.replace(/^0+(?=\d)/, "");
    return digits;
  }

  /** Convert base units ("49000000") back to a human decimal string. */
  static fromBaseUnits(baseUnits: string, decimals: number): string {
    const digits = String(baseUnits).padStart(decimals + 1, "0");
    const int = digits.slice(0, digits.length - decimals) || "0";
    const frac = decimals > 0 ? "." + digits.slice(digits.length - decimals) : "";
    return `${int}${frac.replace(/\.?0+$/, "")}` || "0";
  }

  // ── Payment intents ──────────────────────────────────────────────────

  async createPaymentIntent(
    params: PaymentIntentCreateParams,
    opts: { idempotencyKey?: string } = {}
  ): Promise<PaymentIntent> {
    const decimals = await this.getTokenDecimals();
    return this.request<PaymentIntent>("POST", "/v1/payment-intents", {
      idempotencyKey: opts.idempotencyKey,
      body: {
        amount: StableGateClient.toBaseUnits(params.amount, decimals),
        currency: params.currency,
        reference: params.reference,
        description: params.description,
        customer: params.customer,
        expires_in: params.expires_in,
        fulfilment: params.fulfilment,
      },
    });
  }

  /** GET /v1/payment-intents/:id — the authoritative intent status. */
  async retrievePaymentIntent(intentId: string): Promise<PaymentIntent> {
    return this.request<PaymentIntent>("GET", `/v1/payment-intents/${intentId}`);
  }

  // ── Refunds ──────────────────────────────────────────────────────────

  /**
   * POST /v1/refunds — starts a refund (full or partial).
   * `payment_id` is the gateway payment (pay_…), not the intent id.
   * The response may carry a `signingRequest` (EIP-712 typed data) that the
   * merchant's payout wallet must sign before the relayer submits it; in
   * that case the refund is completed in the gateway dashboard.
   */
  async createRefund(
    params: {
      payment_id: string;
      amount: string; // human decimals
      reason?: string;
    },
    opts: { idempotencyKey?: string } = {}
  ): Promise<RefundResult> {
    const decimals = await this.getTokenDecimals();
    return this.request<RefundResult>("POST", "/v1/refunds", {
      idempotencyKey: opts.idempotencyKey,
      body: {
        payment_id: params.payment_id,
        amount: StableGateClient.toBaseUnits(params.amount, decimals),
        reason: params.reason ?? "customer_request",
      },
    });
  }

  // ── x402 facilitator (agent payments) ────────────────────────────────
  // Docs §6: POST /x402/verify validates the X-PAYMENT payload,
  // POST /x402/settle runs GasGuard and submits via the relayer.
  // The gateway's own docs flag exact x402 payload field names as
  // spec-following (x402.org) — adjust here if the facilitator differs.

  async x402Verify(paymentPayload: unknown, requirements: unknown): Promise<{
    valid: boolean;
    reason?: string;
    [key: string]: unknown;
  }> {
    return this.request("POST", "/x402/verify", {
      body: { payment: paymentPayload, requirements },
    });
  }

  async x402Settle(paymentPayload: unknown, requirements: unknown): Promise<{
    success?: boolean;
    txHash?: string;
    error?: string;
    [key: string]: unknown;
  }> {
    return this.request("POST", "/x402/settle", {
      body: { payment: paymentPayload, requirements },
    });
  }
}

/** Singleton server client configured from the environment. */
export const stablegate = new StableGateClient();
