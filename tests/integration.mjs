/**
 * Integration test suite — runs against a REAL running app + REAL database.
 * No mocks, no stubs: it exercises the actual HTTP surface and asserts that
 * what renders on pages comes from the DB.
 *
 * Required env:
 *   BASE_URL      — app under test (default http://127.0.0.1:3000)
 *   DATABASE_URL  — same DB the app uses (for assertions + order cleanup)
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 DATABASE_URL=postgres://… node tests/integration.mjs
 *   (or `npm run test:integration` with a .env file present)
 *
 * The one order created by the price-tamper test is deleted again at the end.
 */
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required (the DB the running app points at).");
  process.exit(1);
}
const prisma = new PrismaClient({ log: ["error"] });

let passed = 0;
let failed = 0;
const failures = [];

function ok(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push(name + (extra ? ` — ${extra}` : ""));
    console.error(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

function unescapeHtml(html) {
  return html
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'");
}

async function fetchPage(path) {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  const html = unescapeHtml(await res.text());
  return { res, html };
}

async function main() {
  console.log(`\n🧪 Integration tests against ${BASE_URL}\n`);

  // ── 1. Health ────────────────────────────────────────────────────────
  console.log("▸ Health & connectivity");
  {
    const res = await fetch(`${BASE_URL}/api/health`);
    const json = await res.json().catch(() => ({}));
    ok("GET /api/health → 200", res.status === 200, `got ${res.status}`);
    ok("health reports database ok", json?.database?.ok === true, JSON.stringify(json?.database ?? {}));
    ok("health reports published courses > 0", (json?.database?.publishedCourses ?? 0) > 0);
  }

  // ── 2. DB catalog shape ──────────────────────────────────────────────
  const courses = await prisma.course.findMany({ where: { published: true } });
  const featured = courses.filter((c) => c.featured);
  console.log(`\n▸ DB catalog (${courses.length} published, ${featured.length} featured)`);
  ok("seeded catalog present", courses.length >= 9, `got ${courses.length}`);
  ok("every DB course has an https image", courses.every((c) => c.image.startsWith("https://")));
  ok("every DB course has curriculum content", courses.every((c) => Array.isArray(c.curriculum) && c.curriculum.length > 0));
  ok("every DB course has includes content", courses.every((c) => Array.isArray(c.includes) && c.includes.length > 0));

  // ── 3. Homepage renders DB content ───────────────────────────────────
  console.log("\n▸ Homepage (/)");
  {
    const { res, html } = await fetchPage("/");
    ok("GET / → 200", res.status === 200, `got ${res.status}`);
    ok("homepage has featured section", html.includes("Featured courses"));
    ok("homepage shows real stats (Courses published)", html.includes("Courses published"));
    for (const c of featured) {
      ok(`homepage lists featured "${c.title}"`, html.includes(c.title));
    }
    // A non-featured course must NOT be listed in the featured grid.
    const nonFeatured = courses.find((c) => !c.featured);
    if (nonFeatured) {
      ok(`homepage omits non-featured "${nonFeatured.title}"`, !html.includes(nonFeatured.title));
    }
  }

  // ── 4. Courses listing renders every DB course ───────────────────────
  console.log("\n▸ Courses listing (/courses)");
  {
    const { res, html } = await fetchPage("/courses");
    ok("GET /courses → 200", res.status === 200, `got ${res.status}`);
    for (const c of courses) {
      ok(`listing shows "${c.title}"`, html.includes(c.title));
    }
  }

  // ── 5. Course detail pages (DB-only, incl. curriculum/includes) ──────
  console.log("\n▸ Course detail pages");
  for (const c of courses) {
    const { res, html } = await fetchPage(`/courses/${c.slug}`);
    ok(`GET /courses/${c.slug} → 200`, res.status === 200, `got ${res.status}`);
    ok(`  renders title`, html.includes(c.title));
    const firstSection = c.curriculum?.[0]?.section;
    if (firstSection) {
      ok(`  renders DB curriculum section "${firstSection}"`, html.includes(firstSection));
    }
    const firstInclude = c.includes?.[0];
    if (firstInclude) {
      ok(`  renders DB includes item`, html.includes(firstInclude));
    }
    ok(`  renders instructor title from DB`, html.includes("Course Instructor") || (c.instructorTitle && html.includes(c.instructorTitle)));
  }
  {
    const { res } = await fetchPage("/courses/this-course-does-not-exist");
    ok("unknown slug → 404", res.status === 404, `got ${res.status}`);
  }

  // ── 6. Images: direct URLs + Next.js optimizer both resolve ─────────
  console.log("\n▸ Course images");
  for (const c of courses) {
    const direct = await fetch(c.image, { method: "GET" });
    ok(`image host 200: ${new URL(c.image).pathname.slice(0, 44)}`, direct.ok, `got ${direct.status}`);
    const viaNext = await fetch(
      `${BASE_URL}/_next/image?url=${encodeURIComponent(c.image)}&w=828&q=75`
    );
    ok(`  optimizer 200 (remotePatterns)`, viaNext.ok, `got ${viaNext.status}`);
  }

  // ── 7. Order creation: authoritative DB price, tamper-proof ─────────
  console.log("\n▸ Order API (POST /api/orders)");
  let createdOrderId = null;
  {
    const target = courses[0];
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "CI Integration",
        email: "ci-integration@example.com",
        courseId: target.id,
        courseName: "tampered-name-should-not-persist",
        priceUsdt: 0.01, // tampered — must be ignored in favor of the DB price
      }),
    });
    const json = await res.json().catch(() => ({}));
    ok("POST /api/orders → 200/201", res.ok, `got ${res.status} ${JSON.stringify(json)}`);
    ok("order price equals DB price (tamper ignored)", Number(json.priceUsdt) === Number(target.priceUsdt), `got ${json.priceUsdt}, want ${Number(target.priceUsdt)}`);
    ok("order pending", json.status === "PENDING");
    createdOrderId = json.id;

    const dbOrder = createdOrderId
      ? await prisma.order.findUnique({ where: { id: createdOrderId } })
      : null;
    ok("order persisted in DB", !!dbOrder);
    ok("DB order stores DB price + DB course name", !!dbOrder && Number(dbOrder.priceUsdt) === Number(target.priceUsdt) && dbOrder.courseName === target.title);
    ok("gateway unconfigured → gateway null", json.gateway === null, `got ${json.gateway}`);

    const missing = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "CI Integration",
        email: "ci-integration@example.com",
        courseId: "nope-does-not-exist",
        courseName: "x",
        priceUsdt: 1,
      }),
    });
    ok("unknown course → 404 (no catalog bypass)", missing.status === 404, `got ${missing.status}`);
  }

  // ── 8. x402 agent endpoint contract (gateway unconfigured) ──────────
  console.log("\n▸ Agent x402 endpoint");
  {
    const res = await fetch(`${BASE_URL}/api/agent/courses`);
    const json = await res.json().catch(() => ({}));
    ok("GET /api/agent/courses → 503 without gateway", res.status === 503, `got ${res.status}`);
    ok("  error is x402_unavailable", json?.error === "x402_unavailable");
  }

  // ── cleanup ──────────────────────────────────────────────────────────
  if (createdOrderId) {
    await prisma.order.delete({ where: { id: createdOrderId } }).catch(() => {});
    console.log("\n🧹 cleaned up test order");
  }

  console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    console.error("Failures:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Test run crashed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
