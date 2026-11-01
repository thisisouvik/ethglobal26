import { Suspense } from "react";
import CoursesClient from "./CoursesClient";
import { prisma, withDbRetry } from "@/lib/prisma";
import { dbCourseToCourse, type Course } from "@/lib/courses-data";

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

  // The DB is the source of truth — new courses added there appear here.
  let courses: Course[] = [];
  let dbError = false;
  try {
    const rows = await withDbRetry(() =>
      prisma.course.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { rating: "desc" }],
      })
    );
    courses = rows.map(dbCourseToCourse);
  } catch (err) {
    dbError = true;
    console.error("[CoursesPage] database unavailable:", err);
  }

  return (
    <Suspense>
      <CoursesClient
        initialCategory={category || "All"}
        courses={courses}
        dbError={dbError}
      />
    </Suspense>
  );
}
