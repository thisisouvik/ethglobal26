# 🛒 USDTStore — Crypto-Native Course Marketplace

> A decentralized, e-commerce course marketplace where all products are priced and paid in **USDT** on the **WhiteChain** network. Features a Flipkart-style course catalog and a Razorpay-style hosted payment gateway with real-time on-chain confirmation and instant digital delivery.

---

## 🌟 Key Features

- **🛍️ Course Marketplace**: Browse, search, filter by category (Blockchain, Web3, DeFi, Security, Cryptography), and sort courses by rating or price.
- **📖 Product Detail Pages**: In-depth course pages with curriculum breakdowns, lesson lists, instructor credentials, and lifetime access guarantees.
- **💳 StableGate Payment Gateway (`/pay/[orderId]`)**:
  - Gasless USDT checkout hosted by [StableGate](../gateway/gateway-docs): the payer signs one message, the gateway relayer sponsors the gas, USDT settles payer → merchant directly on Whitechain.
  - Server-to-server payment intent creation with idempotency keys (`POST /v1/payment-intents`).
  - Real-time polling with authoritative server-side status sync (`GET /v1/payment-intents/:id`).
  - Legacy manual-transfer fallback when the gateway is unreachable.
- **⚡ Webhook-Driven Backend**:
  - StableGate webhook receiver (`/api/webhooks/stablegate`) with `StableGate-Signature` HMAC-SHA256 verification, timestamp tolerance and event-id dedupe.
  - Idempotent order fulfillment; `payment.succeeded` → PAID, `refund.succeeded` → REFUNDED.
- **🤖 AI-Agent Payments (x402)**: `GET /api/agent/courses` is priced per call (default 0.01 USDT); agents pay with a signed EIP-3009 `X-PAYMENT` header, verified and settled through the gateway facilitator (`/x402/verify`, `/x402/settle`).
- **💸 One-Click Refunds**: Admin-initiated refunds via `POST /v1/refunds` with on-chain cap enforcement and payout-wallet authorization handled in the gateway dashboard.
- **📊 Admin Dashboard (`/dashboard`)**:
  - Real-time stats: total orders, pending, paid, delivered, and total USDT revenue.
  - Gateway connectivity chip (network, token, decimals from `GET /v1/capabilities`).
  - Search and filter orders by status; one-click delivery management and refunds.
- **🎨 Premium Web3 Aesthetic**: Dark theme built according to strict design guidelines using Tailwind CSS v4, Phosphor Icons, and Geist typography.
- **🚀 Vercel & NeonDB Ready**: Configured for serverless deployment with Prisma ORM and connection pooling.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4 |
| **Icons & Motion** | `@phosphor-icons/react`, Framer Motion |
| **Forms & Validation** | React Hook Form, Zod |
| **Database & ORM** | PostgreSQL (NeonDB), Prisma ORM |
| **Network & Payments** | Whitechain Sepolia (chain 1874), StableGate USDT gateway (REST API + webhooks + x402) |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── orders/
│   │   │   ├── route.ts             # POST: Create order + payment intent, GET: List orders (Admin)
│   │   │   └── [id]/
│   │   │       ├── route.ts         # GET: Order status (with gateway sync), PATCH: Update status
│   │   │       ├── intent/route.ts  # POST: Create-or-get StableGate payment intent
│   │   │       ├── refund/route.ts  # POST: Admin refund via POST /v1/refunds
│   │   │       └── fulfilment-status/route.ts # GET: CRE fulfilment endpoint
│   │   ├── webhooks/
│   │   │   └── stablegate/route.ts  # POST: StableGate webhook receiver (HMAC + dedupe)
│   │   ├── webhook/
│   │   │   └── whitechain/route.ts  # POST: Legacy manual-transfer webhook (fallback)
│   │   ├── agent/
│   │   │   └── courses/route.ts     # GET: x402-priced catalog for AI agents
│   │   └── stablegate/
│   │       └── health/route.ts      # GET: Gateway connectivity probe (/v1/capabilities)
│   ├── courses/
│   │   ├── page.tsx                 # Marketplace catalog (Server component)
│   │   ├── CoursesClient.tsx        # Search, category filter & sort (Client component)
│   │   └── [slug]/
│   │       ├── page.tsx             # Course details & curriculum
│   │       └── BuyButton.tsx        # Customer enrollment form -> Redirect to /pay
│   ├── pay/
│   │   └── [orderId]/
│   │       ├── page.tsx             # Hosted payment gateway loader
│   │       └── PaymentClient.tsx    # StableGate checkout + manual-transfer fallback
│   ├── order/
│   │   ├── pending/page.tsx         # Payment awaiting state
│   │   └── success/page.tsx         # Purchase receipt & digital download link
│   ├── dashboard/
│   │   ├── page.tsx                 # Protected admin dashboard loader
│   │   └── DashboardClient.tsx      # Orders table, gateway chip & delivery/refund controls
│   ├── privacy/page.tsx             # Privacy policy
│   ├── terms/page.tsx               # Terms of service
│   ├── not-found.tsx                # Custom 404 page
│   ├── layout.tsx                   # Root layout with global navigation & footer
│   └── page.tsx                     # Landing page with hero, featured items & FAQ
├── components/
│   ├── Navbar.tsx                   # Glassmorphism navigation bar
│   ├── Footer.tsx                   # Footer with marketplace links
│   ├── CourseCard.tsx               # Reusable course card component
│   ├── RevealSection.tsx            # Viewport scroll & word-by-word reveal animations
│   └── FaqAccordion.tsx             # Interactive FAQ accordion
├── lib/
│   ├── config.ts                    # App configuration & fallback constants
│   ├── courses-data.ts              # Course catalog dataset & query helpers
│   └── prisma.ts                    # Prisma singleton instance
├── prisma/
│   └── schema.prisma                # Database schema (Course & Order models)
├── public/                          # Static assets
├── vercel.json                      # Vercel deployment configuration
└── .env.example                     # Environment variables template
```

---

## 🔄 Payment & Order Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Buyer
    participant Client as Next.js Client
    participant API as /api/orders
    participant DB as NeonDB (Prisma)
    participant SG as StableGate Gateway
    participant Payer as Buyer Wallet
    participant Webhook as /api/webhooks/stablegate

    User->>Client: Selects course & enters details
    Client->>API: POST /api/orders { name, email, courseId }
    API->>DB: Create Order (status: PENDING)
    API->>SG: POST /v1/payment-intents (amount, reference, Idempotency-Key)
    SG-->>API: { id (pi_…), checkoutUrl, clientSecret }
    API-->>Client: Returns { orderId, checkoutUrl }
    Client->>Client: Redirect to /pay/[orderId]
    User->>SG: Opens hosted checkout, verifies invoice (PayeeShield)
    Payer->>SG: Signs ONE EIP-3009 typed message (gas sponsored by relayer)
    SG->>SG: Relayer settles USDT payer → merchant payout on-chain
    SG->>Webhook: POST payment.succeeded (StableGate-Signature HMAC)
    Webhook->>DB: Verify signature, dedupe on event id → Order (status: PAID)
    Note over Client: Polling detects status = PAID (server also syncs via GET /v1/payment-intents/:id)
    Client->>Client: Redirects to /order/success?id=[orderId]
    User->>Client: Accesses digital downloads
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: `v20.x` or higher
- **PostgreSQL**: NeonDB connection string or local Postgres instance

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/thisisouvik/ethglobal26.git
cd ethglobal26
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
# Database (NeonDB / PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# StableGate payment gateway (see docs/05-API-AND-SDK.md in the gateway repo)
STABLEGATE_API_URL="http://localhost:4000"          # gateway REST API base URL
STABLEGATE_SECRET_KEY="sk_test_…"                   # dashboard → /developers
STABLEGATE_WEBHOOK_SECRET="whsec_…"                 # webhook signing secret
STABLEGATE_X402_PRICE="0.01"                        # per-call price for /api/agent/courses

# WhiteChain manual-transfer fallback (only used when the gateway is down)
WHITECHAIN_WALLET_ADDRESS="0xYourWhiteChainUSDTWalletAddress"
WHITECHAIN_WEBHOOK_SECRET="your_webhook_hmac_secret"

# Admin Access
ADMIN_SECRET="your_secure_admin_password"

# Digital Fulfillment
PRODUCT_DOWNLOAD_URL="https://your-download-link.com/package"
```

### StableGate setup

1. **Run/point to the gateway** — `STABLEGATE_API_URL` defaults to `http://localhost:4000` (the documented dev base URL).
2. **Get merchant keys** — in the StableGate dashboard (`/developers`): copy the secret key (`sk_test_…`) into `STABLEGATE_SECRET_KEY` and create a webhook endpoint pointing at `https://<your-app>/api/webhooks/stablegate`; copy its signing secret into `STABLEGATE_WEBHOOK_SECRET`.
3. **Apply the schema** — the new gateway columns and the `StableGateEvent` dedupe table need `npm run db:push` (or a migration) once.
4. **Verify connectivity** — `GET /api/stablegate/health` proxies the gateway's `GET /v1/capabilities` (network, USDT token, decimals, feature flags). The dashboard also shows a live gateway chip.

> If `STABLEGATE_SECRET_KEY` is unset or the gateway is unreachable, checkout automatically falls back to the legacy manual-transfer flow (`WHITECHAIN_WALLET_ADDRESS` + `/api/webhook/whitechain`), so the marketplace keeps working.

### 4. Database Setup

Push the schema to your database and generate the Prisma Client:

```bash
npm run db:generate
npm run db:push
```

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the marketplace.

---

## 🛠️ Available Scripts

- `npm run dev`: Starts the Next.js development server
- `npm run build`: Generates Prisma client and creates an optimized production build
- `npm run start`: Runs the production server
- `npm run lint`: Runs ESLint checks
- `npm run typecheck`: Runs TypeScript checks (`tsc --noEmit`)
- `npm run test:integration`: Runs the integration suite against a running app + its real database
- `npm run db:generate`: Generates Prisma Client
- `npm run db:push`: Synchronizes Prisma schema with the database
- `npm run db:migrate`: Creates and applies database migrations
- `npm run db:seed`: Upserts the course catalog (`prisma/courses.seed.json`) into the database
- `npm run db:health`: Checks database reachability and content (used by CI)
- `npm run db:studio`: Opens Prisma Studio GUI to view database records

---

## 🗄️ Database Is the Single Source of Truth

There is **no static course catalog and no fallback data** anywhere in the app:

- Every page (home, `/courses`, `/courses/[slug]`) and every API (`/api/orders`, `/api/agent/courses`) reads course content straight from the database.
- Course **curriculum, includes, and instructor titles live in the DB** (`Course.curriculum` JSON, `Course.includes`, `Course.instructorTitle`) — add a course to the DB and it gets a complete detail page automatically.
- Prices on orders are always taken from the DB row; a tampered client payload cannot set its own price, and orders for unknown courses are rejected (no auto-insert).
- If the database is unreachable, pages show an honest error state (the homepage and catalog never render fake content), and transient Neon cold-start/network blips are retried (`withDbRetry` in `lib/prisma.ts`).
- Content changes flow into the DB via `npm run db:seed` (from `prisma/courses.seed.json`) or Prisma Studio.

Runtime connections use the Neon **pooled** endpoint (`DATABASE_URL`, with `connect_timeout`/`pool_timeout`/`connection_limit` tuning); migrations and `db push` use the **direct** endpoint (`DIRECT_URL`).

---

## 🤖 CI/CD (GitHub Actions)

### `CI` — runs on every push and pull request (`.github/workflows/ci.yml`)

1. **Lint & Typecheck** — ESLint + `tsc --noEmit`.
2. **Build & Integration Tests** — a real PostgreSQL 16 service container is started, then:
   `prisma db push` → seed the catalog → `next build` → `next start` → `npm run test:integration`.
   The integration suite (`tests/integration.mjs`) hits the real app over HTTP and asserts, among other things:
   - `/api/health` reports a reachable database;
   - the homepage lists exactly the featured courses in the DB (and omits non-featured ones);
   - `/courses` and every `/courses/<slug>` render the DB titles, curriculum sections, and includes items (catches "new course 404s" and missing content);
   - **every course image resolves directly and through the Next.js image optimizer** (catches broken image URLs / missing `remotePatterns`);
   - `POST /api/orders` ignores tampered prices and stores the DB price (verified in the DB), rejects unknown courses, and the test order is cleaned up afterwards;
   - `/api/agent/courses` returns the documented `503 x402_unavailable` contract when no gateway key is set.
3. **Production DB health** (push to `main` only) — runs `npm run db:health` against `PROD_DATABASE_URL`, so a "Can't reach database server at …neon.tech" failure is caught on push, not in the browser.

### `Deploy` — runs after CI passes on `main` (`.github/workflows/deploy.yml`)

1. Applies the Prisma schema to the production Neon database (`prisma db push` — additive fields only).
2. Verifies production DB health.
3. Builds and deploys to Vercel (production).
4. Smoke-tests the live deployment's `/api/health`.

**Required repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Purpose |
|---|---|
| `PROD_DATABASE_URL` | Neon **pooled** connection string (runtime + health check) |
| `PROD_DIRECT_URL` | Neon **direct** connection string (schema changes) |
| `VERCEL_TOKEN` | Vercel access token (account settings → tokens) |
| `VERCEL_ORG_ID` | Vercel org id |
| `VERCEL_PROJECT_ID` | Vercel project id |

Until these secrets are added, deploy steps skip themselves with a notice while CI still enforces the full test suite on every change.

---

## 🛡️ Admin Dashboard

To access the admin dashboard:

```
http://localhost:3000/dashboard?token=<ADMIN_SECRET>
```

Replace `<ADMIN_SECRET>` with the value defined in your `.env.local`.

---

## 📦 Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the build command to `prisma generate && next build` (defined in `vercel.json`).
4. Add all environment variables from `.env.example` to your Vercel Project Settings.
5. In the StableGate dashboard, set the webhook endpoint URL to:
   ```
   https://your-project.vercel.app/api/webhooks/stablegate
   ```
   (The legacy `/api/webhook/whitechain` URL is only needed for the manual-transfer fallback.)

---

## 📄 License

This project is licensed under the MIT License.
