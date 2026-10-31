import { CheckCircle, DownloadSimple, Confetti } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order confirmed — ChainCademy",
  description: "Your payment is confirmed. Download your course now.",
};

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { id } = await searchParams;
  if (!id) notFound();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || (order.status !== "PAID" && order.status !== "DELIVERED")) notFound();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-24">
      <div className="w-full max-w-lg text-center">
        {/* Icon */}
        <div
          className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ background: "rgba(38,161,123,0.12)", border: "2px solid rgba(38,161,123,0.4)" }}
        >
          <CheckCircle size={48} weight="fill" className="text-[var(--accent)]" />
        </div>

        <div className="accent-badge mx-auto mb-6">
          <Confetti size={13} weight="fill" />
          <span>Payment confirmed on WhiteChain</span>
        </div>

        <h1 className="heading-3 text-white mb-4">
          You&apos;re enrolled. Download your course.
        </h1>
        <p className="body-3 text-[var(--text-secondary)] mb-10">
          Your USDT payment was confirmed. A download link has also been sent
          to <strong className="text-white">{order.email}</strong>.
        </p>

        {/* Download card */}
        <div className="card p-8 mb-8 text-left" style={{ borderRadius: "var(--radius-xl)" }}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-subtle)]">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--accent-muted)" }}
              >
                <DownloadSimple size={20} weight="duotone" className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="title-3 text-white">{order.courseName}</p>
                <p className="caption-2 text-[var(--text-secondary)]">
                  Lifetime access · All materials included
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="caption-2 text-[var(--text-secondary)]">Order ID</span>
              <span className="caption-3 font-mono text-white">{order.id.slice(0, 20)}…</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="caption-2 text-[var(--text-secondary)]">Amount paid</span>
              <span className="title-3 text-[var(--accent)]">{Number(order.priceUsdt)} USDT</span>
            </div>
            {order.paymentTxHash && (
              <div className="flex justify-between items-start gap-4">
                <span className="caption-2 text-[var(--text-secondary)] shrink-0">Tx hash</span>
                <span className="caption-3 font-mono text-white text-right break-all">
                  {order.paymentTxHash}
                </span>
              </div>
            )}

            <a
              href={order.downloadUrl || "#"}
              className="btn-primary w-full justify-center py-3 mt-2"
              download
            >
              <DownloadSimple size={20} weight="bold" />
              Download course now
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/courses" className="btn-secondary py-2 px-6">
            Browse more courses
          </Link>
          <Link href="/" className="caption-2 text-[var(--text-tertiary)] hover:text-white transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
