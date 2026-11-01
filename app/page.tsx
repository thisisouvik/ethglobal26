import Link from "next/link";
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
  ArrowUpRight,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { COURSES, CATEGORIES, getFeaturedCourses } from "@/lib/courses-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import CourseCard from "@/components/CourseCard";
import FaqAccordion from "@/components/FaqAccordion";
import NetworkCanvas from "@/components/NetworkCanvas";
import { Reveal, StaggerGroup, StaggerItem, Counter, Marquee, KineticHeadline, GlowCard } from "@/components/Motion";

const STATS = [
  { label: "Courses available", value: 24, suffix: "+", icon: BookOpen },
  { label: "Students enrolled", value: 4800, suffix: "+", icon: Users },
  { label: "USDT in payouts", prefix: "$", value: 180, suffix: "K+", icon: CurrencyDollar },
  { label: "Countries reached", value: 63, suffix: "", icon: Globe },
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

const HOW_IT_WORKS = [
  { step: "01", title: "Browse courses", body: "Filter by category, level, or price. Read full course details before committing." },
  { step: "02", title: "Click Buy", body: "Enter your name and email on the course page. No account, no signup." },
  { step: "03", title: "Send USDT", body: "Our payment page shows you the exact amount and wallet address. Send on WhiteChain." },
  { step: "04", title: "Download instantly", body: "Payment confirms in minutes. Your download link arrives by email immediately." },
];

export default async function HomePage() {
  let featured = getFeaturedCourses();
  try {
    const dbFeatured = await prisma.course.findMany({
      where: { featured: true, published: true },
    });
    if (dbFeatured && dbFeatured.length > 0) {
      featured = dbFeatured.map((c) => {
        const staticMatch = COURSES.find((sc) => sc.slug === c.slug);
        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          subtitle: c.subtitle,
          description: c.description,
          longDesc: c.longDesc || staticMatch?.longDesc || "",
          priceUsdt: Number(c.priceUsdt),
          image: c.image,
          category: c.category,
          tags: c.tags,
          instructor: c.instructor,
          instructorTitle: staticMatch?.instructorTitle || "Web3 Specialist",
          duration: c.duration,
          lessons: c.lessons,
          level: (c.level as "Beginner" | "Intermediate" | "Advanced") || "Beginner",
          featured: c.featured,
          rating: Number(c.rating),
          reviewCount: c.reviewCount,
          curriculum: staticMatch?.curriculum || [],
          includes: staticMatch?.includes || [],
        };
      });
    }
  } catch (err) {
    console.error("Neon DB featured query fallback:", err);
  }

  return (
    <div className="flex flex-col">

      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-44 pb-36 overflow-hidden min-h-[92vh]">
        {/* Canvas network background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <NetworkCanvas />
        </div>

        {/* Radial glow overlay */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(38,161,123,0.07) 0%, transparent 65%)" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-40"
            style={{ background: "linear-gradient(to top, #000 0%, transparent 100%)" }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <Reveal>
            <div className="accent-badge mx-auto mb-8 group cursor-default">
              <Sparkle size={13} weight="fill" className="text-[var(--accent)]" />
              <span>Crypto-native course marketplace · Pay in USDT</span>
            </div>
          </Reveal>

          {/* Kinetic headline */}
          <KineticHeadline
            text="Learn Web3. Pay in USDT. No banks required."
            className="heading-1 hero-gradient-text mb-6 justify-center text-center"
          />

          <Reveal delay={0.35}>
            <p className="body-3 text-[var(--text-secondary)] mb-10 mx-auto" style={{ maxWidth: 520 }}>
              The marketplace for crypto-native learners. Browse expert courses,
              pay instantly with USDT on WhiteChain, and get lifetime access in minutes.
            </p>
          </Reveal>

          <Reveal delay={0.45}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link href="/courses" className="btn-primary button-lg py-3.5 px-8 group">
                Browse all courses
                <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link href="#how-it-works" className="btn-secondary py-3.5 px-8">
                How it works
              </Link>
            </div>
          </Reveal>

          {/* Proof strip */}
          <Reveal delay={0.55}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-[var(--text-tertiary)]">
              {["USDT on WhiteChain", "Instant delivery", "Lifetime access", "No account needed"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle size={14} weight="fill" className="text-[var(--accent)]" />
                  <span className="caption-1">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>

        </div>
      </section>

      {/* ─── MARQUEE ─────────────────────────────────────────────────── */}
      <div className="border-y border-[var(--border-subtle)] py-4 bg-[var(--bg-surface-1)] overflow-hidden">
        <Marquee />
      </div>

      {/* ─── STATS ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[var(--bg-surface-1)]">
        <StaggerGroup className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map((s) => (
            <StaggerItem key={s.label}>
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--accent-muted)" }}
                >
                  <s.icon size={22} weight="duotone" className="text-[var(--accent)]" />
                </div>
                <p className="heading-4 text-white">
                  <Counter to={s.value} prefix={s.prefix ?? ""} suffix={s.suffix} />
                </p>
                <p className="caption-2 text-[var(--text-secondary)]">{s.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ─── FEATURED COURSES ────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
              <div>
                <div className="accent-badge mb-4">
                  <Star size={13} weight="fill" />
                  <span>Top rated this month</span>
                </div>
                <h2 className="heading-3 text-white">Featured courses</h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 caption-1 text-[var(--text-secondary)] hover:text-white transition-colors duration-200 group"
               
              >
                View all courses
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {featured.map((course) => (
              <StaggerItem key={course.id} className="h-full flex flex-col">
                <CourseCard course={course} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ─── TAGLINE REVEAL ──────────────────────────────────────────── */}
      <section className="py-36 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-1)] overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="caption-3 tracking-widest uppercase text-[var(--accent)] mb-6">Why ChainCademy?</p>
          </Reveal>
          <KineticHeadline
            text="No Stripe. No PayPal. No bank. Just USDT — and knowledge that lasts forever."
            className="heading-2 text-white leading-tight"
          />
        </div>
      </section>

      {/* ─── CATEGORIES ──────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="heading-3 text-white">Browse by category</h2>
            </div>
          </Reveal>
          <StaggerGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.filter((c) => c !== "All").map((cat) => {
              const count = COURSES.filter((c) => c.category === cat).length;
              return (
                <StaggerItem key={cat}>
                  <Link
                    href={`/courses?category=${cat}`}
                    className="card card-hover p-6 flex flex-col items-center text-center gap-3 group block"
                    style={{ borderRadius: "var(--radius-xl)" }}
                   
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                      style={{ background: "var(--accent-muted)" }}
                    >
                      <BookOpen size={22} weight="duotone" className="text-[var(--accent)]" />
                    </div>
                    <p className="title-3 text-white group-hover:text-[var(--accent)] transition-colors duration-300">
                      {cat}
                    </p>
                    <p className="caption-4 text-[var(--text-tertiary)]">
                      {count} course{count !== 1 ? "s" : ""}
                    </p>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="heading-3 text-white mb-4">How it works</h2>
              <p className="body-3 text-[var(--text-secondary)]">
                From browse to download in under five minutes.
              </p>
            </div>
          </Reveal>

          {/* Step connector layout */}
          <div className="relative">
            {/* Connecting line */}
            <div
              className="absolute top-10 left-8 right-8 h-px hidden md:block"
              style={{ background: "linear-gradient(to right, transparent, var(--border-default), transparent)" }}
              aria-hidden
            />
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((s) => (
                <StaggerItem key={s.step}>
                  <GlowCard className="card p-6 flex flex-col gap-4 h-full" style={{ borderRadius: "var(--radius-xl)" }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono text-[var(--accent)] caption-3"
                        style={{ background: "var(--accent-muted)" }}
                      >
                        {s.step}
                      </div>
                    </div>
                    <h3 className="title-2 text-white">{s.title}</h3>
                    <p className="body-6 text-[var(--text-secondary)]">{s.body}</p>
                  </GlowCard>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* ─── WHY USDT ────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="heading-3 text-white mb-4">Why pay in USDT?</h2>
              <p className="body-3 text-[var(--text-secondary)] mx-auto" style={{ maxWidth: 480 }}>
                USDT payments work for anyone, anywhere — without a bank account,
                credit card, or payment processor.
              </p>
            </div>
          </Reveal>
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TRUST.map((t) => (
              <StaggerItem key={t.title}>
                <GlowCard className="card card-hover p-8 flex gap-5 h-full" style={{ borderRadius: "var(--radius-xl)" }}>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--accent-muted)" }}
                  >
                    <t.icon size={22} weight="duotone" className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="title-2 text-white mb-2">{t.title}</h3>
                    <p className="body-6 text-[var(--text-secondary)]">{t.body}</p>
                  </div>
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ─── SECOND MARQUEE ──────────────────────────────────────────── */}
      <div className="border-t border-[var(--border-subtle)] py-4 overflow-hidden">
        <Marquee />
      </div>

      {/* ─── FAQ ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="heading-3 text-white text-center mb-16">Frequently asked questions</h2>
          </Reveal>
          <FaqAccordion faqs={FAQS} />
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[var(--border-subtle)]">
        <Reveal>
          <div className="max-w-2xl mx-auto">
            <div
              className="relative overflow-hidden card p-16 text-center"
              style={{ borderRadius: "var(--radius-2xl)" }}
            >
              {/* CTA glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(38,161,123,0.08) 0%, transparent 70%)" }}
                aria-hidden
              />
              <div className="relative z-10">
                <div className="accent-badge mx-auto mb-6">
                  <Lightning size={13} weight="fill" />
                  <span>Start now — no signup</span>
                </div>
                <h2 className="heading-3 text-white mb-4">Start learning with USDT today</h2>
                <p className="body-3 text-[var(--text-secondary)] mb-10 mx-auto" style={{ maxWidth: 380 }}>
                  Browse expert courses, pay instantly on WhiteChain, and get
                  lifetime access. No bank needed.
                </p>
                <Link href="/courses" className="btn-primary button-lg py-4 px-10 group">
                  Browse all courses
                  <ArrowRight
                    size={20}
                    weight="bold"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
