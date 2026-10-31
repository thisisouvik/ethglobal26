import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Privacy Policy — USDTStore" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 caption-3 text-[var(--text-secondary)] hover:text-white mb-8 transition-colors duration-300">
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="heading-3 text-white mb-2">Privacy policy</h1>
        <p className="caption-2 text-[var(--text-tertiary)] mb-10">Last updated: November 2026</p>
        <div className="flex flex-col gap-8 body-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="title-2 text-white mb-3">Information we collect</h2>
            <p>When you make a purchase, we collect your name and email address. We use your email solely to deliver your download link and order confirmation. We do not collect payment details — USDT payments are made directly on the WhiteChain blockchain.</p>
          </section>
          <section>
            <h2 className="title-2 text-white mb-3">How we use your information</h2>
            <p>Your name and email are used only to fulfill your order and send you the digital product download link. We do not sell, share, or market to your email address.</p>
          </section>
          <section>
            <h2 className="title-2 text-white mb-3">Data retention</h2>
            <p>We retain order records for accounting purposes. Contact us to request deletion of your personal data.</p>
          </section>
          <section>
            <h2 className="title-2 text-white mb-3">Contact</h2>
            <p>For privacy questions, email us at <span className="text-[var(--accent)]">contact@usdtstore.com</span>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

