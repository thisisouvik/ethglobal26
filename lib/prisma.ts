import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Transient DB failure codes worth retrying:
 *  - P1001 "Can't reach database server" (Neon cold start / network blip)
 *  - P1008 "Operations timed out"
 *  - P2024 "Timed out fetching a connection from the connection pool"
 * Anything else (bad query, missing record) fails fast — no blind retries.
 */
const TRANSIENT_DB_ERRORS = new Set(["P1001", "P1008", "P2024"]);

function isTransientDbError(err: unknown): boolean {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : null;
  if (code && TRANSIENT_DB_ERRORS.has(code)) return true;
  const msg = err instanceof Error ? err.message : "";
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Connection terminated") ||
    msg.includes("timed out fetching a new connection")
  );
}

/**
 * Run a DB read with bounded retries so brief Neon suspend/network hiccups
 * don't take a page down. Real retries against the real DB — never a fallback
 * to cached or static data.
 */
export async function withDbRetry<T>(
  op: () => Promise<T>,
  { retries = 2, baseDelayMs = 600 } = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await op();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isTransientDbError(err)) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      console.warn(
        `[db] transient DB error (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms:`,
        err instanceof Error ? err.message : err
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
