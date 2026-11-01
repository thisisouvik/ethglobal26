// Shared course types + helpers.
//
// The DATABASE is the single source of truth for course content — there is no
// static fallback catalog in the app. New/changed content goes through the DB
// (seed with `npm run db:seed` or edit via Prisma Studio) and every page and
// API reads it from there via `dbCourseToCourse()`.

import type { Prisma } from "@prisma/client";

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  longDesc: string;
  priceUsdt: number;
  image: string;
  category: string;
  tags: string[];
  instructor: string;
  instructorTitle: string;
  duration: string;
  lessons: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  featured: boolean;
  rating: number;
  reviewCount: number;
  curriculum: { section: string; lessons: string[] }[];
  includes: string[];
}

/** Course row as Prisma returns it (before mapping). */
export type DbCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  longDesc: string | null;
  priceUsdt: Prisma.Decimal;
  image: string;
  category: string;
  tags: string[];
  instructor: string;
  instructorTitle: string | null;
  duration: string;
  lessons: number;
  level: string;
  featured: boolean;
  rating: Prisma.Decimal;
  reviewCount: number;
  curriculum: Prisma.JsonValue;
  includes: string[];
};

/** UI taxonomy for filter chips; category counts always come from the DB. */
export const CATEGORIES = [
  "All",
  "Blockchain",
  "Web3",
  "DeFi",
  "Security",
  "Cryptography",
];

/** Runtime-validated shape of the curriculum JSON column. */
function parseCurriculum(raw: unknown): { section: string; lessons: string[] }[] {
  if (!Array.isArray(raw)) return [];
  const out: { section: string; lessons: string[] }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { section, lessons } = item as { section?: unknown; lessons?: unknown };
    if (typeof section !== "string" || !Array.isArray(lessons)) continue;
    if (!lessons.every((l) => typeof l === "string")) continue;
    out.push({ section, lessons: lessons as string[] });
  }
  return out;
}

/**
 * Map a DB Course row to the UI Course shape. Single mapping point so every
 * page/API renders DB content identically. No static lookups — anything the
 * DB doesn't have gets an honest empty/default instead of fake data.
 */
export function dbCourseToCourse(c: DbCourse): Course {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    longDesc: c.longDesc || "",
    priceUsdt: Number(c.priceUsdt),
    image: c.image,
    category: c.category,
    tags: c.tags,
    instructor: c.instructor,
    instructorTitle: c.instructorTitle || "Course Instructor",
    duration: c.duration,
    lessons: c.lessons,
    level: (c.level as Course["level"]) || "Beginner",
    featured: c.featured,
    rating: Number(c.rating),
    reviewCount: c.reviewCount,
    curriculum: parseCurriculum(c.curriculum),
    includes: c.includes || [],
  };
}
