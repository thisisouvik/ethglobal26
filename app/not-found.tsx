import Link from "next/link";
import { ArrowLeft, Warning } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Page not found — USDTStore",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
        style={{ background: "rgba(248,113,113,0.08)", border: "2px solid rgba(248,113,113,0.2)" }}
      >
        <Warning size={36} weight="duotone" className="text-[#f87171]" />
      </div>
      <h1 className="heading-2 text-white mb-4">404</h1>
      <p className="heading-5 text-[var(--text-secondary)] mb-3">
        Page not found
      </p>
      <p className="body-6 text-[var(--text-tertiary)] mb-10 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn-primary py-3 px-8">
        <ArrowLeft size={18} weight="bold" />
        Back to home
      </Link>
    </div>
  );
}

