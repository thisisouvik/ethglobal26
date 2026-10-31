# 🛒 USDTStore — Crypto-Native Course Marketplace

> A decentralized, e-commerce course marketplace where all products are priced and paid in **USDT** on the **WhiteChain** network. Features a Flipkart-style course catalog and a Razorpay-style hosted payment gateway with real-time on-chain confirmation and instant digital delivery.

---

## 🌟 Key Features

- **🛍️ Course Marketplace**: Browse, search, filter by category (Blockchain, Web3, DeFi, Security, Cryptography), and sort courses by rating or price.
- **📖 Product Detail Pages**: In-depth course pages with curriculum breakdowns, lesson lists, instructor credentials, and lifetime access guarantees.
- **💳 Razorpay-Style Payment Gateway (`/pay/[orderId]`)**:
  - Clean split-screen checkout experience with an order summary.
  - Generates a dedicated WhiteChain USDT payment destination with live copy helpers.
  - Real-time polling (`/api/orders/[id]`) that detects payments without page reloads.
  - Active 30-minute payment countdown timer with safety alerts for network selection.
- **⚡ Webhook-Driven Backend**:
  - Dedicated WhiteChain webhook endpoint (`/api/webhook/whitechain`) with HMAC-SHA256 signature verification.
  - Idempotent order fulfillment and underpayment detection.
- **📊 Admin Dashboard (`/dashboard`)**:
  - Real-time stats: total orders, pending, paid, delivered, and total USDT revenue.
  - Search and filter orders by status.
  - One-click delivery management.
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
| **Network & Payments** | WhiteChain USDT Network, Custom Webhook Gateway |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── orders/
│   │   │   ├── route.ts             # POST: Create order, GET: List orders (Admin)
│   │   │   └── [id]/route.ts        # GET: Order status, PATCH: Update status
│   │   └── webhook/
│   │       └── whitechain/route.ts  # POST: WhiteChain payment webhook handler
│   ├── courses/
│   │   ├── page.tsx                 # Marketplace catalog (Server component)
│   │   ├── CoursesClient.tsx        # Search, category filter & sort (Client component)
│   │   └── [slug]/
│   │       ├── page.tsx             # Course details & curriculum
│   │       └── BuyButton.tsx        # Customer enrollment form -> Redirect to /pay
│   ├── pay/
│   │   └── [orderId]/
│   │       ├── page.tsx             # Hosted payment gateway loader
│   │       └── PaymentClient.tsx    # Razorpay-style USDT payment interface
│   ├── order/
│   │   ├── pending/page.tsx         # Payment awaiting state
│   │   └── success/page.tsx         # Purchase receipt & digital download link
│   ├── dashboard/
│   │   ├── page.tsx                 # Protected admin dashboard loader
│   │   └── DashboardClient.tsx      # Orders table & delivery controls
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
    participant Gateway as WhiteChain Gateway
    participant Webhook as /api/webhook/whitechain

    User->>Client: Selects course & enters details
    Client->>API: POST /api/orders { name, email, courseId }
    API->>DB: Create Order (status: PENDING)
    API-->>Client: Returns { orderId, paymentAddr, priceUsdt }
    Client->>Client: Redirect to /pay/[orderId]
    Note over Client: Displays WhiteChain USDT address & countdown timer
    User->>Gateway: Transfers USDT on WhiteChain network
    Gateway->>Webhook: POST with txHash, amount & HMAC signature
    Webhook->>DB: Validates signature & updates Order (status: PAID)
    Note over Client: Polling detects status = PAID
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

# WhiteChain USDT Gateway
WHITECHAIN_WALLET_ADDRESS="0xYourWhiteChainUSDTWalletAddress"
WHITECHAIN_WEBHOOK_SECRET="your_webhook_hmac_secret"

# Admin Access
ADMIN_SECRET="your_secure_admin_password"

# Digital Fulfillment
PRODUCT_DOWNLOAD_URL="https://your-download-link.com/package"
```

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
- `npm run db:generate`: Generates Prisma Client
- `npm run db:push`: Synchronizes Prisma schema with the database
- `npm run db:migrate`: Creates and applies database migrations
- `npm run db:studio`: Opens Prisma Studio GUI to view database records

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
5. In your WhiteChain gateway settings, set the callback webhook URL to:
   ```
   https://your-project.vercel.app/api/webhook/whitechain
   ```

---

## 📄 License

This project is licensed under the MIT License.
