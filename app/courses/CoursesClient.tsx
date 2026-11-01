"use client";

import { useState, useMemo } from "react";
import { MagnifyingGlass, Funnel, SortAscending, Warning } from "@phosphor-icons/react";
import CourseCard from "@/components/CourseCard";
import { CATEGORIES, type Course } from "@/lib/courses-data";
import { RevealSection } from "@/components/RevealSection";

const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Highest rated", value: "rating" },
];

export default function CoursesClient({
  initialCategory,
  courses,
  dbError = false,
}: {
  initialCategory: string;
  courses: Course[];
  dbError?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [level, setLevel] = useState("All Levels");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    let list: Course[] = courses;

    if (category !== "All") {
      list = list.filter((c) => c.category === category);
    }
    if (level !== "All Levels") {
      list = list.filter((c) => c.level === level);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.instructor.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.priceUsdt - b.priceUsdt);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.priceUsdt - a.priceUsdt);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      default:
        list = [...list].sort(
          (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
        );
    }

    return list;
  }, [query, category, level, sort, courses]);

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <RevealSection className="mb-12">
          <h1 className="heading-2 text-white mb-3">All courses</h1>
          <p className="body-3 text-[var(--text-secondary)]">
            {courses.length} courses · Pay in USDT · Lifetime access
          </p>
        </RevealSection>

        {dbError && (
          <div
            className="card p-6 mb-10 flex items-center gap-4"
            style={{ borderRadius: "var(--radius-lg)", borderColor: "rgba(248,113,113,0.35)" }}
          >
            <Warning size={22} weight="duotone" className="text-red-400 shrink-0" />
            <p className="body-6 text-[var(--text-secondary)]">
              Couldn&apos;t reach the course database, so the catalog may be
              incomplete or empty. Please retry in a moment.
            </p>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            />
            <input
              type="text"
              placeholder="Search courses, topics, instructors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl caption-3 transition-all duration-300 ${
                  category === cat
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Second filter row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <Funnel size={15} className="text-[var(--text-tertiary)]" />
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-lg caption-4 transition-colors duration-300 ${
                  level === l
                    ? "bg-[var(--bg-surface-2)] text-white border border-[var(--border-default)]"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAscending size={15} className="text-[var(--text-tertiary)] shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field py-2 text-sm"
              style={{ width: "auto", minWidth: 180 }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="caption-2 text-[var(--text-tertiary)] mb-6">
          Showing {filtered.length} course{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <MagnifyingGlass
              size={40}
              className="text-[var(--text-tertiary)] mx-auto mb-4"
              weight="duotone"
            />
            <p className="title-2 text-[var(--text-secondary)] mb-2">
              No courses found
            </p>
            <p className="body-6 text-[var(--text-tertiary)]">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filtered.map((course, i) => (
              <RevealSection key={course.id} className="h-full flex flex-col" delay={Math.min(i * 60, 300)}>
                <CourseCard course={course} />
              </RevealSection>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

