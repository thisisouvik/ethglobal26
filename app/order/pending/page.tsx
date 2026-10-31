"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Spinner, Clock, CheckCircle, Warning, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { Suspense } from "react";

type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "FAILED" | "REFUNDED";

interface Order {
  id: string;
  status: OrderStatus;
  email: string;
  name: string;
  priceUsdt: number;
  paymentAddr: string;
  paymentTxHash?: string;
  createdAt: string;
}

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data);

      if (data.status === "PAID" || data.status === "DELIVERED") {
        router.push(`/order/success?id=${orderId}`);
      }
    } catch {
      setError("Could not load order. Check the order ID and try again.");
    } finally {
      setLoading(false);
      setAttempts((a) => a + 1);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Poll every 5 seconds while pending
  useEffect(() => {
    if (!order || order.status === "PAID" || order.status === "DELIVERED") return;
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  if (!orderId) {
    return (
      <div className="text-center">
        <Warning size={48} weight="duotone" className="text-amber-400 mx-auto mb-4" />
        <h1 className="heading-4 text-white mb-2">No order ID found</h1>
        <p className="body-6 text-[var(--text-secondary)] mb-6">
          Return to checkout and complete your purchase first.
        </p>
        <Link href="/checkout" className="btn-primary">
          Go to checkout
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    );
  }

  if (loading && attempts === 0) {
    return (
      <div className="text-center">
        <Spinner size={40} className="animate-spin text-[var(--accent)] mx-auto mb-4" />
        <p className="body-5 text-[var(--text-secondary)]">Loading your order…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <Warning size={48} weight="duotone" className="text-[#f87171] mx-auto mb-4" />
        <h1 className="heading-4 text-white mb-2">Order not found</h1>
        <p className="body-6 text-[var(--text-secondary)] mb-6">{error}</p>
        <Link href="/checkout" className="btn-primary">
          Start over
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      {/* Status indicator */}
      <div className="text-center mb-10">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: "rgba(251,191,36,0.1)", border: "2px solid rgba(251,191,36,0.3)" }}
        >
          <Clock size={36} weight="duotone" className="text-amber-400" />
        </div>
        <div className="accent-badge mx-auto mb-4" style={{ borderColor: "rgba(251,191,36,0.3)", color: "#fbbf24", background: "rgba(251,191,36,0.08)" }}>
          <Spinner size={12} className="animate-spin" />
          <span>Awaiting payment confirmation</span>
        </div>
        <h1 className="heading-4 text-white mb-2">
          Waiting for your USDT payment
        </h1>
        <p className="body-6 text-[var(--text-secondary)]">
          This page checks automatically every 5 seconds. Once your payment
          confirms on WhiteChain, you will be redirected instantly.
        </p>
      </div>

      {order && (
        <div className="card p-8 flex flex-col gap-6" style={{ borderRadius: "var(--radius-xl)" }}>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="caption-2 text-[var(--text-secondary)]">Order ID</span>
              <span className="caption-3 font-mono text-white">{order.id.slice(0, 16)}…</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="caption-2 text-[var(--text-secondary)]">Amount due</span>
              <span className="title-3 text-[var(--accent)]">29 USDT</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="caption-2 text-[var(--text-secondary)] shrink-0">Payment address</span>
              <span className="caption-3 font-mono text-white text-right break-all">{order.paymentAddr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="caption-2 text-[var(--text-secondary)]">Status</span>
              <span className="status-pending">{order.status}</span>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: "var(--bg-surface-2)" }}
          >
            <Spinner size={16} className="animate-spin text-[var(--accent)] shrink-0" />
            <p className="caption-2 text-[var(--text-secondary)]">
              Checking payment status… (check #{attempts})
            </p>
          </div>

          <p className="caption-5 text-[var(--text-tertiary)] text-center">
            If you have not sent payment yet, go back to{" "}
            <Link href="/checkout" className="text-[var(--accent)] hover:underline">
              checkout
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

export default function PendingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-24">
      <Suspense fallback={
        <div className="text-center">
          <Spinner size={40} className="animate-spin text-[var(--accent)] mx-auto mb-4" />
        </div>
      }>
        <PendingContent />
      </Suspense>
    </div>
  );
}

