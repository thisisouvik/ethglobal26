import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stablegate } from "@/lib/stablegate/client";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Complete payment — USDTStore",
  robots: { index: false, follow: false },
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      email: true,
      name: true,
      courseName: true,
      priceUsdt: true,
      paymentAddr: true,
      createdAt: true,
      gatewayCheckoutUrl: true,
    },
  });

  if (!order) notFound();

  return (
    <PaymentClient
      order={{
        id: order.id,
        status: order.status,
        email: order.email,
        name: order.name,
        courseName: order.courseName,
        priceUsdt: Number(order.priceUsdt),
        paymentAddr: order.paymentAddr ?? "",
        createdAt: order.createdAt.toISOString(),
      }}
      checkoutUrl={order.gatewayCheckoutUrl}
      gatewayConfigured={stablegate.configured}
    />
  );
}
