import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncOrderFromGateway } from "@/lib/stablegate/orders";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/orders/[id]
//
// Order status for the pay page's poller. While the order is PENDING and a
// gateway intent exists, the authoritative status is refreshed server-side
// via GET /v1/payment-intents/:id (browser callbacks are UI-only per the
// gateway integration rules — fulfilment happens from webhooks or retrieve).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      email: true,
      name: true,
      courseName: true,
      priceUsdt: true,
      paymentAddr: true,
      paymentTxHash: true,
      downloadUrl: true,
      createdAt: true,
      gatewayIntentId: true,
      gatewayPaymentId: true,
      gatewayCheckoutUrl: true,
      gatewayStatus: true,
      refundStatus: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "PENDING" && order.gatewayIntentId) {
    const synced = await syncOrderFromGateway(order);
    if (synced.changed) {
      order = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          email: true,
          name: true,
          courseName: true,
          priceUsdt: true,
          paymentAddr: true,
          paymentTxHash: true,
          downloadUrl: true,
          createdAt: true,
          gatewayIntentId: true,
          gatewayPaymentId: true,
          gatewayCheckoutUrl: true,
          gatewayStatus: true,
          refundStatus: true,
        },
      });
    }
  }

  return NextResponse.json({
    ...order,
    priceUsdt: Number(order!.priceUsdt),
    createdAt: order!.createdAt.toISOString(),
  });
}

// PATCH /api/orders/[id] — admin status update
const patchSchema = z.object({
  status: z.enum(["PAID", "DELIVERED", "FAILED", "REFUNDED"]),
  // Manual reconciliation: explorer tx hash of a real transfer the admin
  // verified on-chain (used when confirming a direct USDT payment).
  paymentTxHash: z.string().trim().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.paymentTxHash ? { paymentTxHash: parsed.data.paymentTxHash } : {}),
      ...(parsed.data.status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
