import { Suspense } from "react";
import CoursesClient from "./CoursesClient";

export const metadata = {
  title: "All Courses — USDTStore Marketplace",
  description:
    "Browse expert Web3 courses. Pay in USDT on WhiteChain. Instant delivery, lifetime access.",
};

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function CoursesPage({ searchParams }: Props) {
  const { category } = await searchParams;

  return (
    <Suspense>
      <CoursesClient initialCategory={category || "All"} />
    </Suspense>
  );
}

