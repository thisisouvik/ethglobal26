"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";

const navLinks = [
  { href: "/courses", label: "Browse courses" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close mobile menu on route change (deferred so the route render commits first)
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      <header
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-5xl"
        ref={menuRef}
      >
        <nav
          className={`nav-glass rounded-2xl px-5 py-3 flex items-center justify-between transition-all duration-500 ${
            scrolled ? "shadow-[0_8px_40px_rgba(0,0,0,0.7)]" : ""
          }`}
          aria-label="Primary navigation"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="ChainCademy home">
            <Image
              src="/logo.svg"
              alt="ChainCademy logo"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span className="heading-6 text-white tracking-tight">
              Chain<span className="text-[var(--accent)]">cademy</span>
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`title-4 px-3 py-2 rounded-lg transition-colors duration-300 block ${
                    pathname === link.href
                      ? "text-white bg-[var(--bg-surface-2)]"
                      : "text-[var(--text-secondary)] hover:text-white"
                  }`}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/courses" className="btn-primary button-sm py-2 px-4 text-sm">
              Start learning
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface-2)] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <div
              style={{
                transform: open ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 400ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </div>
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          className="md:hidden overflow-hidden"
          style={{
            maxHeight: open ? "400px" : "0",
            opacity: open ? 1 : 0,
            transition:
              "max-height 500ms cubic-bezier(0.22,1,0.36,1), opacity 300ms cubic-bezier(0.22,1,0.36,1)",
          }}
          aria-hidden={!open}
        >
          <div className="nav-glass rounded-2xl mt-2 p-4 flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className="title-3 text-[var(--text-secondary)] hover:text-white px-4 py-3 rounded-xl hover:bg-[var(--bg-surface-2)] transition-all duration-300"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 400ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms, transform 400ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
                }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
              <Link href="/courses" className="btn-primary w-full justify-center">
                Start learning
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
