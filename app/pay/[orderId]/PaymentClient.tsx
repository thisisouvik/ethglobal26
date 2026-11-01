"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  CheckCircle,
  Warning,
  Spinner,
  ShieldCheck,
  Clock,
  ArrowRight,
  Lock,
  ArrowSquareOut,
  GasPump,
} from "@phosphor-icons/react";
import Link from "next/link";

interface OrderInfo {
  id: string;
  status: string;
  email: string;
  name: string;
  courseName: string;
  priceUsdt: number;
  paymentAddr: string;
  createdAt: string;
}

interface Props {
  order: OrderInfo;
  /** StableGate hosted checkout URL (/c/<intentId>) for this order's intent. */
  checkoutUrl: string | null;
  /** True when STABLEGATE_SECRET_KEY is configured on the server. */
  gatewayConfigured: boolean;
}

const TERMINAL_OK = ["PAID", "DELIVERED"];

export default function PaymentClient({ order, checkoutUrl, gatewayConfigured }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState<"addr" | "amount" | null>(null);
  const [status, setStatus] = useState(order.status);
  const [checks, setChecks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min — matches intent expires_in

  // StableGate intent state (requires_authorization → … → succeeded)
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(checkoutUrl);
  const [gatewayStatus, setGatewayStatus] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(!checkoutUrl && gatewayConfigured);
  const [connectError, setConnectError] = useState("");

  const paid = TERMINAL_OK.includes(status);

  // Lazily create the payment intent when the order was created while the
  // gateway was unreachable (POST /api/orders/[id]/intent is idempotent).
  useEffect(() => {
    if (checkoutUrl || !gatewayConfigured || paid) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/intent`, { method: "POST" });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error || "Could not reach the payment gateway");
        setGatewayUrl(json.checkoutUrl ?? null);
      } catch (e) {
        if (!cancelled) setConnectError(e instanceof Error ? e.message : "Gateway unreachable");
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order.id, checkoutUrl, gatewayConfigured, paid]);

  // Poll order status; the server reconciles with the gateway
  // (GET /v1/payment-intents/:id) before answering — browser is UI-only.
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      if (data.gatewayStatus) setGatewayStatus(data.gatewayStatus);
      if (data.checkoutUrl && !gatewayUrl) setGatewayUrl(data.checkoutUrl);
      setChecks((c) => c + 1);
      if (TERMINAL_OK.includes(data.status)) {
        router.push(`/order/success?id=${order.id}`);
      }
    } catch {
      /* silently ignore network errors during polling */
    }
  }, [order.id, router, gatewayUrl]);

  useEffect(() => {
    if (paid) {
      router.push(`/order/success?id=${order.id}`);
      return;
    }
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [poll, paid, order.id, router]);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  const copy = async (text: string, key: "addr" | "amount") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── Left panel — branding / order summary ─────────── */}
      <div
        className="lg:w-[420px] lg:min-h-screen flex flex-col p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)]"
        style={{ background: "var(--bg-surface-1)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="heading-6 text-white">USDTStore</span>
        </Link>

        {/* Order summary */}
        <div className="flex-1">
          <p className="caption-3 text-[var(--text-tertiary)] uppercase tracking-widest mb-6">
            Order summary
          </p>

          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--accent-muted)" }}
              >
                <span className="text-[var(--accent)] text-lg font-bold">₮</span>
              </div>
              <div className="flex-1">
                <p className="title-3 text-white mb-0.5">{order.courseName}</p>
                <p className="caption-2 text-[var(--text-secondary)]">
                  Lifetime access · Digital delivery
                </p>
              </div>
              <p className="title-2 text-[var(--accent)] shrink-0">{order.priceUsdt} USDT</p>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-4 flex items-center justify-between">
              <p className="title-3 text-white">Total due</p>
              <p className="heading-4 text-[var(--accent)]">{order.priceUsdt} USDT</p>
            </div>
          </div>

          {/* Customer details */}
          <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: "var(--bg-surface-2)" }}
          >
            <div className="flex justify-between">
              <span className="caption-4 text-[var(--text-tertiary)]">Name</span>
              <span className="caption-3 text-white">{order.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="caption-4 text-[var(--text-tertiary)]">Email</span>
              <span className="caption-3 text-white">{order.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="caption-4 text-[var(--text-tertiary)]">Order ID</span>
              <span className="caption-3 font-mono text-white">{order.id.slice(0, 16)}…</span>
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-8 flex flex-col gap-3 text-[var(--text-tertiary)]">
          {[
            { icon: ShieldCheck, text: "Secured by StableGate · non-custodial USDT" },
            { icon: GasPump, text: "Gasless — you sign once, no WBT needed" },
            { icon: Lock, text: "Settled directly on Whitechain" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <Icon size={14} weight="fill" />
              <span className="caption-5">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right panel — payment ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">

          {/* Status + timer */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  background: status === "PENDING"
                    ? "#fbbf24"
                    : status === "FAILED"
                      ? "#f87171"
                      : "#26a17b",
                }}
              />
              <span className="caption-3 text-[var(--text-secondary)]">
                {status === "PENDING"
                  ? "Awaiting payment"
                  : status === "FAILED"
                    ? "Payment expired or failed"
                    : "Payment confirmed!"}
              </span>
              {checks > 0 && (
                <span className="caption-5 text-[var(--text-tertiary)]">(check #{checks})</span>
              )}
            </div>
            {timeLeft > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
              >
                <Clock size={12} className="text-amber-400" />
                <span className="caption-3 font-mono text-amber-400">
                  {mins}:{secs}
                </span>
              </div>
            )}
          </div>

          {status === "FAILED" ? (
            <>
              <h1 className="heading-4 text-white mb-2">This payment window expired</h1>
              <p className="body-6 text-[var(--text-secondary)] mb-8">
                The payment intent is no longer valid. Place the order again to get a fresh
                checkout — nothing was charged.
              </p>
              <Link href="/courses" className="btn-primary w-full justify-center py-3">
                Browse courses <ArrowRight size={16} weight="bold" />
              </Link>
            </>
          ) : gatewayUrl ? (
            <>
              {/* ── StableGate hosted checkout mode ── */}
              <h1 className="heading-4 text-white mb-2">
                Pay {order.priceUsdt} USDT with StableGate
              </h1>
              <p className="body-6 text-[var(--text-secondary)] mb-8">
                Gasless checkout: sign one message in your wallet — the gateway relayer
                sponsors the transaction fee. USDT goes directly to the merchant wallet.
              </p>

              <a
                href={gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center py-4 mb-3"
              >
                Pay {order.priceUsdt} USDT securely
                <ArrowSquareOut size={18} weight="bold" />
              </a>

              {gatewayStatus && (
                <p className="caption-5 text-[var(--text-tertiary)] text-center mb-4">
                  Gateway status: <span className="font-mono">{gatewayStatus}</span>
                </p>
              )}

              {/* Polling status */}
              <div
                className="flex items-center gap-3 p-4 rounded-xl mb-6"
                style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
              >
                <Spinner size={16} className="animate-spin text-[var(--accent)] shrink-0" />
                <p className="caption-2 text-[var(--text-secondary)]">
                  Waiting for on-chain confirmation… this page updates automatically once
                  the payment settles.
                </p>
              </div>

              {/* Steps guide */}
              <div className="flex flex-col gap-3">
                {[
                  "Click the pay button — StableGate's hosted checkout opens",
                  "Verify the invoice and sign once in your wallet (no gas token needed)",
                  "Return here — the order confirms automatically when the chain settles",
                ].map((step, i) => (
                  <div key={step} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--accent-muted)", border: "1px solid rgba(38,161,123,0.3)" }}
                    >
                      <span className="text-[var(--accent)] font-mono text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="caption-2 text-[var(--text-secondary)]">{step}</p>
                  </div>
                ))}
              </div>
            </>
          ) : connecting ? (
            <>
              <h1 className="heading-4 text-white mb-2">Connecting to payment gateway…</h1>
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
              >
                <Spinner size={16} className="animate-spin text-[var(--accent)] shrink-0" />
                <p className="caption-2 text-[var(--text-secondary)]">
                  Creating a StableGate payment intent for this order…
                </p>
              </div>
            </>
          ) : (
            <>
              {/* ── Fallback: legacy manual transfer (gateway unavailable) ── */}
              <div
                className="flex items-start gap-3 p-4 rounded-xl mb-6"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}
              >
                <Warning size={15} weight="fill" className="text-amber-400 mt-0.5 shrink-0" />
                <p className="caption-2 text-amber-300/80">
                  StableGate checkout is unavailable right now
                  {connectError ? ` (${connectError})` : ""}. You can still pay by direct
                  USDT transfer below.
                </p>
              </div>

              <h1 className="heading-4 text-white mb-2">
                Send {order.priceUsdt} USDT to complete your purchase
              </h1>
              <p className="body-6 text-[var(--text-secondary)] mb-8">
                Open your USDT wallet, switch to the WhiteChain network, and send the exact
                amount below to the address shown.
              </p>

              {/* Amount */}
              <div className="mb-4">
                <label className="caption-3 text-[var(--text-secondary)] block mb-2">
                  Amount to send (exact)
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
                  >
                    <span className="text-[var(--accent)] font-mono font-bold text-2xl">
                      {order.priceUsdt}
                    </span>
                    <span className="text-[var(--text-secondary)] font-semibold">USDT</span>
                  </div>
                  <button
                    onClick={() => copy(String(order.priceUsdt), "amount")}
                    className="w-12 h-12 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-colors duration-300 shrink-0"
                    aria-label="Copy amount"
                  >
                    {copied === "amount" ? (
                      <CheckCircle size={18} weight="fill" className="text-[var(--accent)]" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="caption-3 text-[var(--text-secondary)] block mb-2">
                  WhiteChain USDT wallet address
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 p-4 rounded-xl font-mono text-white text-sm break-all"
                    style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
                  >
                    {order.paymentAddr || "0xYourWalletAddressHere"}
                  </div>
                  <button
                    onClick={() => copy(order.paymentAddr, "addr")}
                    className="w-12 h-12 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-colors duration-300 shrink-0"
                    aria-label="Copy address"
                  >
                    {copied === "addr" ? (
                      <CheckCircle size={18} weight="fill" className="text-[var(--accent)]" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div
                className="flex items-start gap-3 p-4 rounded-xl mb-6"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}
              >
                <Warning size={15} weight="fill" className="text-amber-400 mt-0.5 shrink-0" />
                <p className="caption-2 text-amber-300/80">
                  Send USDT only on the WhiteChain network. Sending on Ethereum, BSC, or Tron
                  will result in permanent loss of funds.
                </p>
              </div>

              {/* Polling status */}
              <div
                className="flex items-center gap-3 p-4 rounded-xl mb-6"
                style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
              >
                <Spinner size={16} className="animate-spin text-[var(--accent)] shrink-0" />
                <p className="caption-2 text-[var(--text-secondary)]">
                  Watching the blockchain for your payment… this page updates automatically.
                </p>
              </div>
            </>
          )}

          <p className="caption-5 text-[var(--text-tertiary)] mt-8 text-center">
            Having issues?{" "}
            <Link href="/" className="text-[var(--accent)] hover:underline">
              Contact support
            </Link>{" "}
            with order ID: <span className="font-mono">{order.id.slice(0, 20)}…</span>
          </p>
        </div>
      </div>
    </div>
  );
}
