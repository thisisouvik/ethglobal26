"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, BookOpen, ArrowRight } from "@phosphor-icons/react";
import type { Course } from "@/lib/courses-data";

const LEVEL_COLOR: Record<string, string> = {
  Beginner: "rgba(38,161,123,0.15)",
  Intermediate: "rgba(251,191,36,0.1)",
  Advanced: "rgba(239,68,68,0.1)",
};
const LEVEL_TEXT: Record<string, string> = {
  Beginner: "#26a17b",
  Intermediate: "#fbbf24",
  Advanced: "#f87171",
};

export default function CourseCard({ course }: { course: Course }) {
  // Broken or unreachable image URLs in the DB degrade to a themed
  // placeholder instead of a permanently empty gray box.
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="card flex flex-col h-full w-full overflow-hidden group transition-all duration-300 hover:border-[var(--border-default)]"
      style={{
        borderRadius: "var(--radius-xl)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-[200px] shrink-0 overflow-hidden bg-[var(--bg-surface-2)]">
        {imageFailed ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(38,161,123,0.18) 0%, var(--bg-surface-3) 75%)",
            }}
          >
            <span className="heading-1 text-white/15 font-bold select-none">
              {course.title.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageFailed(true)}
          />
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="accent-badge text-xs backdrop-blur-md bg-black/60">{course.category}</span>
        </div>
        {/* Price */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className="flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(38,161,123,0.4)", color: "#26a17b" }}
          >
            ₮ {Number(course.priceUsdt).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col p-5 flex-1 justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          {/* Level badge */}
          <span
            className="self-start caption-3 px-2 py-0.5 rounded-md font-medium"
            style={{
              background: LEVEL_COLOR[course.level] || LEVEL_COLOR.Beginner,
              color: LEVEL_TEXT[course.level] || LEVEL_TEXT.Beginner,
            }}
          >
            {course.level}
          </span>

          <h3 className="title-2 text-white leading-snug line-clamp-2 min-h-[52px] font-semibold">
            {course.title}
          </h3>
          <p className="caption-2 text-[var(--text-secondary)] line-clamp-2 min-h-[40px] leading-relaxed">
            {course.subtitle}
          </p>
        </div>

        {/* Bottom section pinned to the bottom */}
        <div className="flex flex-col gap-3 pt-3 mt-auto border-t border-[var(--border-subtle)]">
          {/* Meta row */}
          <div className="flex items-center justify-between text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <Star size={13} weight="fill" className="text-amber-400" />
              <span className="caption-3 text-white font-medium">{course.rating}</span>
              <span className="caption-5 text-[var(--text-tertiary)]">({course.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
              <Clock size={13} />
              <span className="caption-5">{course.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
              <BookOpen size={13} />
              <span className="caption-5">{course.lessons} lessons</span>
            </div>
          </div>

          {/* Instructor & CTA */}
          <div className="flex items-center justify-between">
            <p className="caption-4 text-[var(--text-tertiary)] truncate max-w-[160px]">
              by <span className="text-[var(--text-secondary)]">{course.instructor}</span>
            </p>
            <span className="caption-3 text-[var(--accent)] flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-1 font-medium">
              Enroll now <ArrowRight size={12} weight="bold" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
