export const PRODUCT = {
  id: "digital-course-v1",
  name: process.env.NEXT_PUBLIC_PRODUCT_NAME || "Digital Course",
  priceUsdt: Number(process.env.NEXT_PUBLIC_PRICE_USDT || "29"),
  description:
    "A complete digital course to help you master the subject. Lifetime access, instant delivery after payment.",
  features: [
    "Instant digital delivery after payment",
    "Lifetime access to all materials",
    "USDT payment — no banks, no middlemen",
    "Secure WhiteChain network transaction",
  ],
  downloadUrl: process.env.PRODUCT_DOWNLOAD_URL || "#",
} as const;

export const WALLET_ADDRESS =
  process.env.WHITECHAIN_WALLET_ADDRESS || "0xYourUSDTWalletAddressHere";

export const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin123";

