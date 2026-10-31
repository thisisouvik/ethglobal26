"use client";

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
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="card flex flex-col overflow-hidden group transition-all duration-500"
      style={{
        borderRadius: "var(--radius-xl)",
        transition: "transform 500ms cubic-bezier(0.22,1,0.36,1), border-color 300ms cubic-bezier(0.22,1,0.36,1)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
      }}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="accent-badge text-xs">{course.category}</span>
        </div>
        {/* Price */}
        <div className="absolute top-3 right-3">
          <span
            className="flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm"
            style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(38,161,123,0.4)", color: "#26a17b" }}
          >
            ₮ {course.priceUsdt}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Level badge */}
        <span
          className="self-start caption-3 px-2 py-0.5 rounded-md"
          style={{
            background: LEVEL_COLOR[course.level],
            color: LEVEL_TEXT[course.level],
          }}
        >
          {course.level}
        </span>

        <h3 className="title-2 text-white leading-snug">{course.title}</h3>
        <p className="caption-2 text-[var(--text-secondary)] line-clamp-2">{course.subtitle}</p>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-auto pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1">
            <Star size={13} weight="fill" className="text-amber-400" />
            <span className="caption-3 text-white">{course.rating}</span>
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

        {/* Instructor */}
        <div className="flex items-center justify-between">
          <p className="caption-4 text-[var(--text-tertiary)]">by {course.instructor}</p>
          <span className="caption-3 text-[var(--accent)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            View course <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

