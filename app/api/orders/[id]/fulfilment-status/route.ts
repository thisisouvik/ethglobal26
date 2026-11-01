import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/[id]/fulfilment-status
 *
 * Merchant fulfilment endpoint for the gateway's Chainlink CRE workflow
 * (docs 02-ARCHITECTURE.md Flow D): after a payment, the workflow polls
 * this URL and reports { paymentId, status, evidenceHash } back to the
 * gateway. Unfulfilled-by-deadline payments raise an exception and a
 * suggested refund in the gateway dashboard.
 *
 * Response vocabulary per the flow: fulfilled | pending | error.
 * No PII — the reference and delivery state only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, deliveredAt: true },
  });

  if (!order) {
    return NextResponse.json(
      { reference: id, fulfilment: "error", note: "order_not_found" },
      { status: 404 }
    );
  }

  const fulfilment =
    order.status === "DELIVERED" || order.deliveredAt
      ? "fulfilled"
      : order.status === "FAILED" || order.status === "REFUNDED"
        ? "error"
        : "pending"; // PENDING (awaiting payment) or PAID (awaiting delivery)

  return NextResponse.json({
    reference: order.id,
    status: order.status,
    fulfilment,
    ...(order.deliveredAt ? { deliveredAt: order.deliveredAt.toISOString() } : {}),
  });
}
