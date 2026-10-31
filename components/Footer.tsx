import Image from "next/image";
import Link from "next/link";
import { TwitterLogo, TelegramLogo, GithubLogo } from "@phosphor-icons/react/dist/ssr";

const footerLinks = {
  Learn: [
    { label: "All courses", href: "/courses" },
    { label: "Blockchain", href: "/courses?category=Blockchain" },
    { label: "Web3", href: "/courses?category=Web3" },
    { label: "DeFi", href: "/courses?category=DeFi" },
    { label: "Security", href: "/courses?category=Security" },
  ],
  Company: [
    { label: "Home", href: "/" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "FAQ", href: "/#faq" },
  ],
  Legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.svg"
                alt="ChainCademy"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="heading-6 text-white">
                Chain<span className="text-[var(--accent)]">cademy</span>
              </span>
            </Link>
            <p className="body-6 text-[var(--text-secondary)] max-w-xs mb-6">
              The crypto-native course marketplace. Pay in USDT on WhiteChain — no banks, no credit cards, instant lifetime access.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: TwitterLogo, label: "Twitter" },
                { icon: TelegramLogo, label: "Telegram" },
                { icon: GithubLogo, label: "GitHub" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-colors duration-300"
                >
                  <Icon size={16} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="caption-3 text-[var(--text-tertiary)] uppercase tracking-widest mb-4">
                {group}
              </h3>
              <ul className="flex flex-col gap-3" role="list">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="body-6 text-[var(--text-secondary)] hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="caption-2 text-[var(--text-tertiary)]">
            © 2026 ChainCademy. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#26a17b" }}
            />
            <p className="caption-2 text-[var(--text-tertiary)]">
              Payments on WhiteChain · USDT
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
