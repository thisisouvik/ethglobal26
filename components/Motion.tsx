"use client";

import React from "react";

// ─── Static wrapper (scroll reveal animation removed) ─────────
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return <div className={className}>{children}</div>;
}

// ─── Static Stagger group & item ──────────────────────────────
export function StaggerGroup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

// ─── Instant Counter (no scroll wait) ─────────────────────────
export function Counter({
  to,
  suffix = "",
  prefix = "",
  className = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {prefix}
      {to.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Marquee strip ────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Solidity",
  "DeFi Protocols",
  "Zero-Knowledge Proofs",
  "Rust on Solana",
  "Smart Contract Security",
  "Web3 with Next.js",
  "EVM Architecture",
  "Tokenomics",
  "USDT Payments",
  "WhiteChain",
];

export function Marquee() {
  return (
    <div className="overflow-hidden w-full select-none" aria-hidden>
      <div
        className="flex gap-8 whitespace-nowrap animate-marquee"
        style={{
          width: "max-content",
          animation: "marquee 35s linear infinite",
        }}
      >
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="caption-1 text-[var(--text-tertiary)] uppercase tracking-widest">
              {item}
            </span>
            <span className="text-[var(--accent)] text-xs">✦</span>
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Clean Static Headline (no blur/stagger on scroll) ────────
export function KineticHeadline({
  text,
  className = "",
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return <h2 className={className}>{text}</h2>;
}

// ─── Clean Card (no GPU mousemove spotlight lag) ──────────────
export function GlowCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden transition-colors duration-200 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
