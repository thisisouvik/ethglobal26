import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  Clock,
  BookOpen,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Lock,
  Broadcast,
  DownloadSimple,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr";
import { getCourseBySlug, COURSES } from "@/lib/courses-data";
import { RevealSection } from "@/components/RevealSection";
import BuyButton from "./BuyButton";

export async function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return {};
  return {
    title: `${course.title} — USDTStore`,
    description: course.subtitle,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const totalLessons = course.curriculum.reduce(
    (sum, s) => sum + s.lessons.length,
    0
  );

  return (
    <div className="min-h-screen pt-24 pb-24">

      {/* ─── Hero / Above fold ──────────────────────────────── */}
      <div className="border-b border-[var(--border-subtle)]" style={{ background: "var(--bg-surface-1)" }}>
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Left — course info (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <Link
              href="/courses"
              className="flex items-center gap-2 caption-3 text-[var(--text-secondary)] hover:text-white transition-colors duration-300 self-start"
            >
              <ArrowLeft size={13} /> Back to marketplace
            </Link>

            <div className="flex flex-wrap gap-2">
              <span className="accent-badge">{course.category}</span>
              <span
                className="caption-3 px-2 py-0.5 rounded-md"
                style={{ background: "var(--bg-surface-3)", color: "var(--text-secondary)" }}
              >
                {course.level}
              </span>
            </div>

            <h1 className="heading-2 text-white">{course.title}</h1>
            <p className="body-3 text-[var(--text-secondary)]">{course.subtitle}</p>

            {/* Rating row */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    weight={i < Math.round(course.rating) ? "fill" : "regular"}
                    className="text-amber-400"
                  />
                ))}
                <span className="title-4 text-white ml-1">{course.rating}</span>
                <span className="caption-2 text-[var(--text-tertiary)]">
                  ({course.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center gap-4 text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1 caption-2">
                  <Clock size={13} /> {course.duration}
                </span>
                <span className="flex items-center gap-1 caption-2">
                  <BookOpen size={13} /> {course.lessons} lessons
                </span>
                <span className="flex items-center gap-1 caption-2">
                  <Users size={13} /> {course.reviewCount}+ students
                </span>
              </div>
            </div>

            <p className="caption-2 text-[var(--text-secondary)]">
              Created by{" "}
              <span className="text-[var(--accent)]">{course.instructor}</span>
              {" · "}{course.instructorTitle}
            </p>
          </div>

          {/* Right — sticky purchase card (2 cols) */}
          <div className="lg:col-span-2">
            <div
              className="card overflow-hidden sticky top-28"
              style={{ borderRadius: "var(--radius-2xl)" }}
            >
              {/* Course thumbnail */}
              <div className="relative" style={{ height: 220 }}>
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(38,161,123,0.9)" }}
                  >
                    <Play size={24} weight="fill" className="text-white translate-x-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="heading-2 text-[var(--accent)]">
                    {course.priceUsdt}
                  </span>
                  <span className="heading-5 text-[var(--text-secondary)]">USDT</span>
                </div>

                {/* Buy button — client component with form */}
                <BuyButton course={course} />

                <p className="caption-5 text-[var(--text-tertiary)] text-center">
                  30-day money-back guarantee · Lifetime access
                </p>

                {/* Includes */}
                <div className="border-t border-[var(--border-subtle)] pt-4">
                  <p className="caption-3 text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                    This course includes
                  </p>
                  <ul className="flex flex-col gap-2">
                    {course.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle
                          size={15}
                          weight="fill"
                          className="text-[var(--accent)] mt-0.5 shrink-0"
                        />
                        <span className="caption-2 text-[var(--text-secondary)]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Body content ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 flex flex-col gap-12">

          {/* What you'll learn */}
          <RevealSection>
            <div className="card p-8" style={{ borderRadius: "var(--radius-xl)" }}>
              <h2 className="heading-5 text-white mb-6">What you will learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.curriculum.flatMap((s) => s.lessons).slice(0, 10).map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle size={15} weight="fill" className="text-[var(--accent)] mt-0.5 shrink-0" />
                    <span className="caption-2 text-[var(--text-secondary)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>

          {/* Description */}
          <RevealSection>
            <div>
              <h2 className="heading-5 text-white mb-4">About this course</h2>
              <p className="body-3 text-[var(--text-secondary)]">{course.longDesc}</p>
            </div>
          </RevealSection>

          {/* Curriculum */}
          <RevealSection>
            <div>
              <h2 className="heading-5 text-white mb-2">Course curriculum</h2>
              <p className="caption-2 text-[var(--text-tertiary)] mb-6">
                {course.curriculum.length} sections · {totalLessons} lessons · {course.duration}
              </p>
              <div className="flex flex-col gap-3">
                {course.curriculum.map((section, si) => (
                  <div
                    key={section.section}
                    className="card overflow-hidden"
                    style={{ borderRadius: "var(--radius-lg)" }}
                  >
                    <div
                      className="flex items-center justify-between px-5 py-4"
                      style={{ background: "var(--bg-surface-2)" }}
                    >
                      <h3 className="title-3 text-white">{section.section}</h3>
                      <span className="caption-4 text-[var(--text-tertiary)]">
                        {section.lessons.length} lessons
                      </span>
                    </div>
                    <ul className="divide-y divide-[var(--border-subtle)]">
                      {section.lessons.map((lesson, li) => (
                        <li
                          key={lesson}
                          className="flex items-center gap-3 px-5 py-3"
                        >
                          {li === 0 && si === 0 ? (
                            <Play size={13} weight="fill" className="text-[var(--accent)] shrink-0" />
                          ) : (
                            <Lock size={13} className="text-[var(--text-tertiary)] shrink-0" />
                          )}
                          <span className="caption-2 text-[var(--text-secondary)]">
                            {lesson}
                          </span>
                          {li === 0 && si === 0 && (
                            <span className="ml-auto caption-4 text-[var(--accent)]">
                              Preview
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>

          {/* Instructor */}
          <RevealSection>
            <div>
              <h2 className="heading-5 text-white mb-6">Your instructor</h2>
              <div className="card p-6 flex gap-5" style={{ borderRadius: "var(--radius-xl)" }}>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {course.instructor.charAt(0)}
                </div>
                <div>
                  <h3 className="title-2 text-white mb-1">{course.instructor}</h3>
                  <p className="caption-2 text-[var(--accent)] mb-3">{course.instructorTitle}</p>
                  <p className="body-6 text-[var(--text-secondary)]">
                    Expert instructor with years of hands-on industry experience. All course materials are production-quality and kept up to date.
                  </p>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>

        {/* Right sidebar — just spacer on mobile, card already sticky */}
        <div className="hidden lg:block lg:col-span-2" />
      </div>

      {/* ─── Mobile sticky buy bar ──────────────────────────── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-40"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="caption-5 text-[var(--text-tertiary)]">Price</p>
            <p className="title-2 text-[var(--accent)]">{course.priceUsdt} USDT</p>
          </div>
          <Link
            href={`/courses/${course.slug}/buy`}
            className="btn-primary flex-1 justify-center py-3"
          >
            Buy this course
            <ArrowRight size={18} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}

