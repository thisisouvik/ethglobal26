import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  images: {
    // Course images come from the DB and may use any https CDN (Unsplash,
    // Pexels, instructor-hosted assets, …). Restricting hosts here caused
    // images of newly added courses to silently fail to load, so https is
    // allowed broadly; broken URLs degrade to a placeholder in CourseCard.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
