import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { ADMIN_SECRET } from "@/lib/config";
import { stablegate } from "@/lib/stablegate/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard — ChainCademy",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (token !== ADMIN_SECRET) redirect("/?unauthorized=1");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Gateway connectivity (GET /v1/capabilities) — a down gateway degrades
  // refunds and intent creation, so surface it to the operator.
  let gateway: { connected: boolean; network?: string; token?: string; decimals?: number } = {
    connected: false,
  };
  if (stablegate.configured) {
    try {
      const caps = await stablegate.getCapabilities();
      gateway = {
        connected: true,
        network: (caps.network as string) ?? (caps.networkName as string),
        token: (caps.tokenSymbol as string) ?? (caps.token as string) ?? "USDT",
        decimals: typeof caps.decimals === "number" ? caps.decimals : undefined,
      };
    } catch {
      gateway = { connected: false };
    }
  }

  const serialized = orders.map((o) => ({
    ...o,
    priceUsdt: Number(o.priceUsdt),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    deliveredAt: o.deliveredAt?.toISOString() ?? null,
    webhookData: null,
    gatewayIntentId: o.gatewayIntentId,
    gatewayPaymentId: o.gatewayPaymentId,
    gatewayRefundId: o.gatewayRefundId,
    refundStatus: o.refundStatus,
    refundMode: o.refundMode,
  }));

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    paid: orders.filter((o) => o.status === "PAID").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    revenue: orders
      .filter((o) => o.status !== "FAILED" && o.status !== "REFUNDED")
      .reduce((sum, o) => sum + Number(o.priceUsdt), 0),
  };

  return (
    <DashboardClient orders={serialized} stats={stats} token={token ?? ""} gateway={gateway} />
  );
}
