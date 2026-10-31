import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
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
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...order,
    priceUsdt: Number(order.priceUsdt),
    createdAt: order.createdAt.toISOString(),
  });
}

// PATCH /api/orders/[id] — admin status update
const patchSchema = z.object({
  status: z.enum(["PAID", "DELIVERED", "FAILED", "REFUNDED"]),
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
      ...(parsed.data.status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
