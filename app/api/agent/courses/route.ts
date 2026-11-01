import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { stablegate } from "@/lib/stablegate/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/agent/courses — x402-priced route for AI agents.
 *
 * Implements Flow C of the gateway architecture (02-ARCHITECTURE.md §6):
 *   1. Agent calls without payment → 402 + paymentRequirements
 *      (scheme "exact", network, asset USDT, amount, payTo).
 *   2. Agent retries with an `X-PAYMENT` header carrying a signed EIP-3009
 *      authorization (within its own spending policy).
 *   3. We submit it to the gateway facilitator: POST /x402/verify then
 *      POST /x402/settle (same relayer, same ledger as human checkouts).
 *   4. On settle we return the data plus an `X-PAYMENT-RESPONSE` header.
 *
 * The gateway's own docs note that exact x402 payload field names follow
 * the current spec at https://www.x402.org/ — if the facilitator differs,
 * only `buildRequirements`/`decodeX402Payment` below need adjusting.
 *
 * Configure the per-call price with STABLEGATE_X402_PRICE (USDT, default 0.01).
 */

const X402_PRICE = process.env.STABLEGATE_X402_PRICE || "0.01";

/** Advertise the payment requirements the agent must satisfy. */
async function buildRequirements() {
  const caps = await stablegate.getCapabilities().catch(() => null);
  const network =
    (caps?.network as string | undefined) ??
    (caps?.networkName as string | undefined) ??
    (typeof caps?.chainId === "number" ? String(caps.chainId) : "whitechain-sepolia");
  const asset =
    (caps?.tokenSymbol as string | undefined) ??
    (caps?.token as string | undefined) ??
    "USDT";
  // payTo is the merchant payout registered on-chain in MerchantRegistry;
  // the facilitator rejects anything else at settle time.
  const payTo =
    ((caps?.payTo ?? caps?.payout ?? caps?.payoutAddress) as string | undefined) ?? null;

  return {
    scheme: "exact",
    network,
    asset,
    maxAmountRequired: await priceInBaseUnits(),
    ...(payTo ? { payTo } : {}),
    description: "USDTStore course catalog (per-request access)",
  };
}

async function priceInBaseUnits(): Promise<string> {
  const decimals = await stablegate.getTokenDecimals();
  const [int = "0", frac = ""] = X402_PRICE.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return `${int}${padded}`;
}

/** Accept the X-PAYMENT payload as JSON or base64-encoded JSON. */
function decodeX402Payment(header: string): unknown {
  try {
    return JSON.parse(header);
  } catch {
    try {
      return JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    } catch {
      return null;
    }
  }
}

async function catalogPayload() {
  // Live catalog straight from the DB — agents see exactly what humans see.
  const rows = await withDbRetry(() =>
    prisma.course.findMany({
      where: { published: true },
      orderBy: { rating: "desc" },
    })
  );
  return {
    source: "USDTStore marketplace",
    price: `${X402_PRICE} USDT per request`,
    courses: rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      category: c.category,
      priceUsdt: Number(c.priceUsdt),
      lessons: c.lessons,
      level: c.level,
    })),
  };
}

export async function GET(req: NextRequest) {
  if (!stablegate.configured) {
    return NextResponse.json(
      { error: "x402_unavailable", message: "StableGate gateway not configured" },
      { status: 503 }
    );
  }

  const requirements = await buildRequirements();
  const paymentHeader = req.headers.get("x-payment");

  // Step 1: no payment → 402 with requirements
  if (!paymentHeader) {
    return NextResponse.json(
      {
        error: "x402_payment_required",
        message: `This endpoint costs ${X402_PRICE} USDT per request (scheme exact, Whitechain USDT).`,
        paymentRequirements: requirements,
      },
      {
        status: 402,
        headers: { "X-PAYMENT-REQUIREMENTS": JSON.stringify(requirements) },
      }
    );
  }

  // Step 2: verify + settle through the gateway facilitator
  const payment = decodeX402Payment(paymentHeader);
  if (!payment) {
    return NextResponse.json(
      { error: "x402_invalid_payment", message: "X-PAYMENT must be JSON or base64 JSON" },
      { status: 400 }
    );
  }

  let verification;
  try {
    verification = await stablegate.x402Verify(payment, requirements);
  } catch (err) {
    return NextResponse.json(
      {
        error: "x402_verification_error",
        message: err instanceof Error ? err.message : "Facilitator unreachable",
      },
      { status: 502 }
    );
  }

  if (!verification.valid) {
    return NextResponse.json(
      {
        error: "x402_payment_invalid",
        message: verification.reason ?? "Facilitator rejected the payment payload",
      },
      { status: 402 }
    );
  }

  let settlement;
  try {
    settlement = await stablegate.x402Settle(payment, requirements);
  } catch (err) {
    return NextResponse.json(
      {
        error: "x402_settlement_error",
        message: err instanceof Error ? err.message : "Facilitator settle failed",
      },
      { status: 502 }
    );
  }

  if (settlement.error || settlement.success === false) {
    return NextResponse.json(
      {
        error: "x402_settlement_failed",
        message: settlement.error ?? "Settlement rejected",
      },
      { status: 402 }
    );
  }

  // Step 3: paid — return data + settlement receipt header
  return NextResponse.json(catalogPayload(), {
    status: 200,
    headers: {
      "X-PAYMENT-RESPONSE": JSON.stringify({
        txHash: settlement.txHash ?? null,
        settled: true,
        network: requirements.network,
      }),
    },
  });
}
