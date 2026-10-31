import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ChainCademy — Learn Web3. Pay in USDT.",
    template: "%s — ChainCademy",
  },
  description:
    "The crypto-native course marketplace. Buy expert Web3 courses with USDT on WhiteChain. Instant delivery, lifetime access, no bank required.",
  keywords: ["Web3 courses", "USDT payment", "blockchain learning", "crypto education", "WhiteChain", "DeFi courses", "Solidity"],
  authors: [{ name: "ChainCademy" }],
  openGraph: {
    title: "ChainCademy — Learn Web3. Pay in USDT.",
    description: "Expert Web3 courses. Pay in USDT on WhiteChain. Instant lifetime access.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://chaincademy.vercel.app",
    siteName: "ChainCademy",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainCademy — Learn Web3. Pay in USDT.",
    description: "Expert Web3 courses. Pay in USDT on WhiteChain. Instant lifetime access.",
  },
  icons: { icon: "/logo.svg" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-base)]">
        <Navbar />
        <main id="main-content" className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
