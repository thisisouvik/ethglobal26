"use client";

import { useState } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  CurrencyDollar,
  MagnifyingGlass,
  ArrowLeft,
  BookOpen,
  ArrowUUpLeft,
  Plugs,
} from "@phosphor-icons/react";
import Link from "next/link";

type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "FAILED" | "REFUNDED";

interface Order {
  id: string;
  name: string;
  email: string;
  status: OrderStatus;
  priceUsdt: number;
  courseName: string;
  paymentTxHash: string | null;
  createdAt: string;
  gatewayPaymentId: string | null;
  gatewayRefundId: string | null;
  refundStatus: string | null;
  refundMode: string | null;
}

interface Stats {
  total: number;
  pending: number;
  paid: number;
  delivered: number;
  revenue: number;
}

interface Gateway {
  connected: boolean;
  network?: string;
  token?: string;
  decimals?: number;
}

interface Props {
  orders: Order[];
  stats: Stats;
  token: string;
  gateway: Gateway;
}

const STATUS_FILTERS: (OrderStatus | "ALL")[] = [
  "ALL", "PENDING", "PAID", "DELIVERED", "FAILED", "REFUNDED",
];

function statusClass(s: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    PENDING: "status-pending",
    PAID: "status-paid",
    DELIVERED: "status-delivered",
    FAILED: "status-failed",
    REFUNDED: "status-refunded",
  };
  return map[s];
}

export default function DashboardClient({ orders, stats, token, gateway }: Props) {
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "ALL" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.email.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.courseName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const markDelivered = async (id: string) => {
    setMarkingId(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ status: "DELIVERED" }),
    });
    window.location.reload();
  };

  // Manual reconciliation for direct USDT transfers: the admin verifies the
  // payer's transaction on the explorer, then confirms it here with the tx hash.
  const markPaid = async (id: string) => {
    const txHash = prompt(
      "Paste the transaction hash after verifying the transfer on the explorer\n" +
        "(https://explorer.testnet.whitechain.io). Leave empty to skip."
    );
    if (txHash === null) return; // cancelled
    setMarkingId(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({
        status: "PAID",
        ...(txHash.trim() ? { paymentTxHash: txHash.trim() } : {}),
      }),
    });
    window.location.reload();
  };

  // POST /api/orders/[id]/refund → gateway POST /v1/refunds.
  // Router-path refunds still need the payout-wallet signature in the
  // gateway dashboard; manual mode is a plain transfer matched by the
  // gateway observer. refund.succeeded arrives via webhook either way.
  const refundOrder = async (order: Order) => {
    if (!order.gatewayPaymentId) {
      setNotice("This order has no StableGate payment recorded — nothing to refund via the gateway.");
      return;
    }
    if (!confirm(`Refund ${order.priceUsdt} USDT to ${order.email}?`)) return;

    setRefundingId(order.id);
    setNotice("");
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ reason: "customer_request" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Refund failed");
      setNotice(
        json.needsSignature
          ? `Refund ${json.refundId} created — complete the payout-wallet signature in the StableGate dashboard to submit it.`
          : `Refund ${json.refundId} ${json.status} (mode: ${json.mode}).`
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <Link href="/" className="flex items-center gap-1 caption-3 text-[var(--text-secondary)] hover:text-white mb-2 transition-colors duration-300">
              <ArrowLeft size={12} /> Home
            </Link>
            <h1 className="heading-3 text-white">Admin dashboard</h1>
            <p className="body-6 text-[var(--text-secondary)] mt-1">ChainCademy — order management</p>
          </div>

          {/* Gateway connectivity (GET /v1/capabilities) */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl caption-3"
            style={{
              background: gateway.connected ? "var(--accent-muted)" : "rgba(248,113,113,0.1)",
              color: gateway.connected ? "var(--accent)" : "#f87171",
              border: `1px solid ${gateway.connected ? "rgba(38,161,123,0.3)" : "rgba(248,113,113,0.3)"}`,
            }}
          >
            <Plugs size={14} weight="fill" />
            {gateway.connected
              ? `StableGate · ${gateway.network ?? "network"} · ${gateway.token ?? "USDT"}${
                  gateway.decimals !== undefined ? ` (${gateway.decimals})` : ""
                }`
              : "StableGate gateway offline"}
          </div>
        </div>

        {notice && (
          <div
            className="flex items-start gap-2 p-4 rounded-xl mb-6"
            style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
          >
            <CheckCircle size={14} weight="fill" className="text-[var(--accent)] mt-0.5 shrink-0" />
            <p className="caption-3 text-[var(--text-secondary)]">{notice}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Total orders", value: stats.total, icon: Package, color: "var(--text-secondary)" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "#fbbf24" },
            { label: "Paid", value: stats.paid, icon: CheckCircle, color: "var(--accent)" },
            { label: "Delivered", value: stats.delivered, icon: Truck, color: "#818cf8" },
            { label: "Revenue", value: `${stats.revenue} USDT`, icon: CurrencyDollar, color: "var(--accent)" },
          ].map((s) => (
            <div key={s.label} className="card p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <s.icon size={14} weight="duotone" style={{ color: s.color }} />
                <span className="caption-5 text-[var(--text-secondary)]">{s.label}</span>
              </div>
              <p className="heading-5 text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlass size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by name, email, order ID, or course…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg caption-3 transition-colors duration-300 ${
                  filter === f
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden" style={{ borderRadius: "var(--radius-xl)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Order ID", "Customer", "Course", "Status", "Amount", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-4 caption-3 text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <BookOpen size={32} weight="duotone" className="text-[var(--text-tertiary)] mx-auto mb-3" />
                      <p className="body-6 text-[var(--text-secondary)]">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-2)] transition-colors duration-200"
                    >
                      <td className="px-5 py-4">
                        <span className="caption-4 font-mono text-[var(--text-secondary)]">
                          {order.id.slice(0, 12)}…
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="caption-3 text-white">{order.name}</p>
                        <p className="caption-5 text-[var(--text-secondary)]">{order.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="caption-3 text-white max-w-[180px] truncate">{order.courseName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusClass(order.status)}>{order.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="caption-3 text-[var(--accent)]">{order.priceUsdt} USDT</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="caption-5 text-[var(--text-secondary)]">
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {order.status === "PENDING" && (
                            <button
                              onClick={() => markPaid(order.id)}
                              disabled={markingId === order.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] caption-3 hover:bg-[var(--accent)] hover:text-white transition-colors duration-300 disabled:opacity-50 whitespace-nowrap"
                            >
                              <CheckCircle size={12} />
                              {markingId === order.id ? "…" : "Mark paid"}
                            </button>
                          )}
                          {order.status === "PAID" && (
                            <button
                              onClick={() => markDelivered(order.id)}
                              disabled={markingId === order.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] caption-3 hover:bg-[var(--accent)] hover:text-white transition-colors duration-300 disabled:opacity-50 whitespace-nowrap"
                            >
                              <Truck size={12} />
                              {markingId === order.id ? "…" : "Mark delivered"}
                            </button>
                          )}
                          {(order.status === "PAID" || order.status === "DELIVERED") &&
                            order.refundStatus !== "succeeded" && (
                              <button
                                onClick={() => refundOrder(order)}
                                disabled={refundingId === order.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[rgba(248,113,113,0.4)] text-[#f87171] caption-3 hover:bg-[#f87171] hover:text-white transition-colors duration-300 disabled:opacity-50 whitespace-nowrap"
                              >
                                <ArrowUUpLeft size={12} />
                                {refundingId === order.id ? "…" : "Refund"}
                              </button>
                            )}
                          {order.refundStatus && (
                            <span className="caption-5 text-[var(--text-tertiary)] whitespace-nowrap">
                              ↩ {order.refundStatus}
                              {order.refundMode ? ` (${order.refundMode})` : ""}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="caption-5 text-[var(--text-tertiary)] mt-6 text-center">
          {filtered.length} of {orders.length} orders
        </p>
      </div>
    </div>
  );
}
