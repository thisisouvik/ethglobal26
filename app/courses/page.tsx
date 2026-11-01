import { Suspense } from "react";
import CoursesClient from "./CoursesClient";
import { prisma } from "@/lib/prisma";
import { COURSES, type Course } from "@/lib/courses-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All Courses — ChainCademy Marketplace",
  description:
    "Browse expert Web3 courses. Pay in USDT on WhiteChain. Instant delivery, lifetime access.",
};

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function CoursesPage({ searchParams }: Props) {
  const { category } = await searchParams;

  let dbCourses: Course[] = [];
  try {
    const raw = await prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
    });
    if (raw && raw.length > 0) {
      dbCourses = raw.map((c) => {
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
    console.error("Neon DB query fallback to catalog:", err);
  }

  const coursesToUse = dbCourses.length > 0 ? dbCourses : COURSES;

  return (
    <Suspense>
      <CoursesClient initialCategory={category || "All"} courses={coursesToUse} />
    </Suspense>
  );
}
