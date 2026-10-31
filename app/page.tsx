import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  BookOpen,
  ShieldCheck,
  Lightning,
  CurrencyDollar,
  Globe,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { RevealSection, TaglineReveal } from "@/components/RevealSection";
import { COURSES, CATEGORIES, getFeaturedCourses } from "@/lib/courses-data";
import CourseCard from "@/components/CourseCard";
import FaqAccordion from "@/components/FaqAccordion";

const STATS = [
  { label: "Courses available", value: "24+", icon: BookOpen },
  { label: "Students enrolled", value: "4,800+", icon: Users },
  { label: "USDT in payouts", value: "$180K+", icon: CurrencyDollar },
  { label: "Countries reached", value: "63", icon: Globe },
];

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Non-custodial payments",
    body: "USDT goes straight to the instructor's wallet. No platform holding your funds.",
  },
  {
    icon: Lightning,
    title: "Instant access after payment",
    body: "WhiteChain confirms in minutes. Download links delivered the moment it clears.",
  },
  {
    icon: TrendUp,
    title: "Lifetime access, no subscriptions",
    body: "Pay once in USDT. Return whenever you want. No monthly fees, ever.",
  },
  {
    icon: Globe,
    title: "No bank account needed",
    body: "Anyone with a crypto wallet can buy. No credit card, no PayPal, no KYC.",
  },
];

const FAQS = [
  {
    q: "Which USDT network do you accept?",
    a: "All courses are priced and paid in USDT on the WhiteChain network. Make sure your wallet supports WhiteChain before sending. USDT on Ethereum, BSC, or Tron will not be credited.",
  },
  {
    q: "How long does payment take to confirm?",
    a: "WhiteChain transactions typically confirm in 1 to 3 minutes. Your order page updates automatically the moment your payment is detected.",
  },
  {
    q: "What do I get after purchasing a course?",
    a: "You receive a download link to the complete course package — all video lessons, source code, templates, and bonus materials. Lifetime access with all future updates included.",
  },
  {
    q: "Can I get a refund?",
    a: "Digital products are non-refundable once delivered. If there is an issue with the course files, contact us and we will make it right within 24 hours.",
  },
  {
    q: "Do I need an account to buy?",
    a: "No account required. Just your name, email, and USDT. Your download link is emailed to you immediately after payment confirms.",
  },
  {
    q: "Is my payment secure?",
    a: "Your USDT payment goes directly on-chain to the instructor's wallet. There is no custodian, no intermediary, and no central party holding your funds at any point.",
  },
];

export default function HomePage() {
  const featured = getFeaturedCourses();

  return (
    <div className="flex flex-col">

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28 overflow-hidden">
        {/* glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(ellipse, #26a17b 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="accent-badge mx-auto mb-8">
            <Lightning size={13} weight="fill" />
            <span>Crypto-native course marketplace · Pay in USDT</span>
          </div>

          <h1 className="heading-1 hero-gradient-text mb-6" style={{ maxWidth: 760, margin: "0 auto 24px" }}>
            Learn Web3.<br />
            Pay in USDT.<br />
            No banks required.
          </h1>

          <p className="body-3 text-[var(--text-secondary)] mb-10 mx-auto" style={{ maxWidth: 540 }}>
            The marketplace for crypto-native learners. Browse expert courses, pay instantly with USDT on WhiteChain, and get lifetime access in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/courses" className="btn-primary button-lg py-3 px-8">
              Browse all courses
              <ArrowRight size={20} weight="bold" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary py-3 px-8">
              How it works
            </Link>
          </div>

          {/* proof strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[var(--text-tertiary)]">
            {["USDT on WhiteChain", "Instant delivery", "Lifetime access", "No account needed"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle size={14} weight="fill" className="text-[var(--accent)]" />
                <span className="caption-1">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats bar ───────────────────────────────────── */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center gap-2">
              <s.icon size={22} weight="duotone" className="text-[var(--accent)]" />
              <p className="heading-4 text-white">{s.value}</p>
              <p className="caption-2 text-[var(--text-secondary)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured courses ─────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <div>
                <div className="accent-badge mb-4">
                  <Star size={13} weight="fill" />
                  <span>Top rated this month</span>
                </div>
                <h2 className="heading-3 text-white">Featured courses</h2>
              </div>
              <Link href="/courses" className="btn-secondary py-2 px-5 text-sm">
                View all courses →
              </Link>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((course, i) => (
              <RevealSection key={course.id} delay={i * 80}>
                <CourseCard course={course} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tagline Reveal (B11 mandatory) ──────────────── */}
      <section className="py-32 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
        <div className="max-w-4xl mx-auto">
          <TaglineReveal
            text="No Stripe. No PayPal. No bank. Just USDT — and knowledge that lasts forever."
            className="heading-2 text-white leading-tight"
          />
        </div>
      </section>

      {/* ─── Categories ──────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="heading-3 text-white mb-12 text-center">Browse by category</h2>
          </RevealSection>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.filter(c => c !== "All").map((cat, i) => {
              const count = COURSES.filter(c => c.category === cat).length;
              return (
                <RevealSection key={cat} delay={i * 60}>
                  <Link
                    href={`/courses?category=${cat}`}
                    className="card card-hover p-6 flex flex-col items-center text-center gap-3 group"
                    style={{ borderRadius: "var(--radius-xl)" }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--accent-muted)" }}
                    >
                      <BookOpen size={22} weight="duotone" className="text-[var(--accent)]" />
                    </div>
                    <p className="title-3 text-white group-hover:text-[var(--accent)] transition-colors duration-300">
                      {cat}
                    </p>
                    <p className="caption-4 text-[var(--text-tertiary)]">{count} course{count !== 1 ? "s" : ""}</p>
                  </Link>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
        <div className="max-w-5xl mx-auto">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="heading-3 text-white mb-4">How it works</h2>
              <p className="body-3 text-[var(--text-secondary)]">
                From browse to download in under five minutes.
              </p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Browse courses", body: "Filter by category, level, or price. Read full course details before committing." },
              { step: "02", title: "Click Buy", body: "Enter your name and email on the course page. No account, no signup." },
              { step: "03", title: "Send USDT", body: "Our payment page shows you the exact amount and wallet address. Send on WhiteChain." },
              { step: "04", title: "Download instantly", body: "Payment confirms in minutes. Your download link arrives by email immediately." },
            ].map((s, i) => (
              <RevealSection key={s.step} delay={i * 80}>
                <div className="card p-6 flex flex-col gap-4">
                  <span className="font-mono text-[var(--accent)] caption-3">{s.step}</span>
                  <h3 className="title-2 text-white">{s.title}</h3>
                  <p className="body-6 text-[var(--text-secondary)]">{s.body}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why USDT ─────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="heading-3 text-white mb-4">Why pay in USDT?</h2>
              <p className="body-3 text-[var(--text-secondary)] mx-auto" style={{ maxWidth: 480 }}>
                USDT payments work for anyone, anywhere — without a bank account, credit card, or payment processor.
              </p>
            </div>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRUST.map((t, i) => (
              <RevealSection key={t.title} delay={i * 80}>
                <div className="card card-hover p-8 flex gap-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-muted)" }}>
                    <t.icon size={22} weight="duotone" className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="title-2 text-white mb-2">{t.title}</h3>
                    <p className="body-6 text-[var(--text-secondary)]">{t.body}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
        <div className="max-w-3xl mx-auto">
          <RevealSection>
            <h2 className="heading-3 text-white text-center mb-16">Frequently asked questions</h2>
          </RevealSection>
          <FaqAccordion faqs={FAQS} />
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-2xl mx-auto">
          <RevealSection>
            <div className="card p-12 text-center" style={{ borderRadius: "var(--radius-2xl)" }}>
              <h2 className="heading-3 text-white mb-4">Start learning with USDT today</h2>
              <p className="body-3 text-[var(--text-secondary)] mb-8 mx-auto" style={{ maxWidth: 400 }}>
                Browse expert courses, pay instantly on WhiteChain, and get lifetime access. No bank needed.
              </p>
              <Link href="/courses" className="btn-primary button-lg py-3 px-8">
                Browse all courses
                <ArrowRight size={20} weight="bold" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
}
