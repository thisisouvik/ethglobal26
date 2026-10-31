import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Terms of Service — USDTStore" };

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 caption-3 text-[var(--text-secondary)] hover:text-white mb-8 transition-colors duration-300">
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="heading-3 text-white mb-2">Terms of service</h1>
        <p className="caption-2 text-[var(--text-tertiary)] mb-10">Last updated: November 2026</p>
        <div className="flex flex-col gap-8 body-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="title-2 text-white mb-3">Digital products</h2>
            <p>All products are digital downloads. By purchasing, you agree that delivery is electronic and begins immediately upon payment confirmation. You waive any right of withdrawal applicable to digital content once delivery has started.</p>
          </section>
          <section>
            <h2 className="title-2 text-white mb-3">Payment</h2>
            <p>All prices are denominated in USDT (Tether). Payments are made on the WhiteChain network. Ensure you send the correct token and network — misdirected payments cannot be recovered. Underpayments will not fulfill your order.</p>
          </section>
          <section>
            <h2 className="title-2 text-white mb-3">Refunds</h2>
            <p>Digital products are non-refundable once the download link has been delivered. If a file is corrupted or inaccessible, contact us and we will provide a working copy.</p>
          </section>
          <section>
            <h2 className="title-2 text-white mb-3">License</h2>
            <p>Your purchase grants you a personal, non-exclusive, non-transferable license to use the materials. Redistribution, resale, or public sharing of the product files is prohibited.</p>
          </section>
          <section>
            <h2 className="title-2 text-white mb-3">Contact</h2>
            <p>Questions? Email <span className="text-[var(--accent)]">contact@usdtstore.com</span>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

