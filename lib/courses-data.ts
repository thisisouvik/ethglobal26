// Static course catalog — used for listing pages.
// In production these are seeded into the DB via prisma/seed.ts.
// The DB is the source of truth for orders; courses here drive the UI.

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  longDesc: string;
  priceUsdt: number;
  image: string;
  category: string;
  tags: string[];
  instructor: string;
  instructorTitle: string;
  duration: string;
  lessons: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  featured: boolean;
  rating: number;
  reviewCount: number;
  curriculum: { section: string; lessons: string[] }[];
  includes: string[];
}

export const COURSES: Course[] = [
  {
    id: "course-solidity-01",
    slug: "solidity-smart-contracts",
    title: "Solidity Smart Contract Development",
    subtitle: "Build and deploy production-ready smart contracts on EVM chains",
    description:
      "Master Solidity from scratch and ship secure, gas-optimized smart contracts. Covers ERC-20, ERC-721, upgradeable proxies, and DeFi primitives.",
    longDesc:
      "This course takes you from writing your first Solidity function to deploying a full DeFi protocol. You will learn how the EVM works under the hood, how to use Hardhat and Foundry, how to write gas-efficient code, and how to audit your own contracts before going live.",
    priceUsdt: 49,
    image:
      "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&q=80&auto=format&fit=crop",
    category: "Blockchain",
    tags: ["Solidity", "EVM", "DeFi", "Smart Contracts"],
    instructor: "Arjun Mehta",
    instructorTitle: "Senior Smart Contract Engineer",
    duration: "18 hours",
    lessons: 74,
    level: "Intermediate",
    featured: true,
    rating: 4.8,
    reviewCount: 312,
    curriculum: [
      {
        section: "EVM Fundamentals",
        lessons: ["How the EVM executes bytecode", "Storage, memory, calldata", "Gas mechanics"],
      },
      {
        section: "Solidity Core",
        lessons: ["Types and visibility", "Functions and modifiers", "Events and errors", "Interfaces and inheritance"],
      },
      {
        section: "Token Standards",
        lessons: ["ERC-20 from scratch", "ERC-721 and metadata", "ERC-1155 multi-token"],
      },
      {
        section: "DeFi Patterns",
        lessons: ["AMM design", "Lending pools", "Flash loans", "Price oracles"],
      },
      {
        section: "Security and Auditing",
        lessons: ["Reentrancy attacks", "Integer overflow", "Access control bugs", "Slither and Mythril"],
      },
    ],
    includes: [
      "74 video lessons · 18 hours total",
      "Hardhat and Foundry project templates",
      "3 production-grade contract projects",
      "Security audit checklist",
      "Lifetime access and updates",
    ],
  },
  {
    id: "course-nextjs-02",
    slug: "nextjs-fullstack-web3",
    title: "Full-Stack Web3 with Next.js",
    subtitle: "Connect React frontends to smart contracts — ship a dApp in a weekend",
    description:
      "Learn to build full-stack Web3 applications with Next.js 16, wagmi, viem, and IPFS. Go from a blank repo to a deployed dApp with a real contract backend.",
    longDesc:
      "This course covers the complete stack for modern dApp development: Next.js App Router, Tailwind, wagmi/viem for contract calls, wallet connection with RainbowKit, on-chain data fetching, and IPFS for decentralized storage. By the end you will have shipped a functional NFT marketplace.",
    priceUsdt: 39,
    image:
      "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80&auto=format&fit=crop",
    category: "Web3",
    tags: ["Next.js", "wagmi", "viem", "dApp", "React"],
    instructor: "Priya Sharma",
    instructorTitle: "Lead Frontend Engineer, Web3",
    duration: "14 hours",
    lessons: 58,
    level: "Intermediate",
    featured: true,
    rating: 4.7,
    reviewCount: 198,
    curriculum: [
      {
        section: "Next.js 16 Foundations",
        lessons: ["App Router architecture", "Server components vs client", "Data fetching patterns"],
      },
      {
        section: "Wallet Integration",
        lessons: ["RainbowKit setup", "Signing messages", "Multi-chain support"],
      },
      {
        section: "Contract Interaction",
        lessons: ["Reading contract state", "Writing transactions", "Event subscriptions", "Error handling"],
      },
      {
        section: "Building the NFT Marketplace",
        lessons: ["Listing and buying NFTs", "IPFS metadata", "Royalties", "Deploying to mainnet"],
      },
    ],
    includes: [
      "58 video lessons · 14 hours total",
      "Complete NFT marketplace source code",
      "Reusable wagmi hooks library",
      "Design system with Tailwind",
      "Lifetime access and updates",
    ],
  },
  {
    id: "course-defi-03",
    slug: "defi-protocol-engineering",
    title: "DeFi Protocol Engineering",
    subtitle: "Architect and build your own lending, staking, and yield protocols",
    description:
      "An advanced deep dive into DeFi protocol design. Study Aave, Uniswap, and Compound architectures, then build your own protocol from the ground up.",
    longDesc:
      "For engineers who already know Solidity and want to build production DeFi. Covers automated market makers, interest rate models, liquidation mechanics, governance systems, and protocol security. Includes a complete clone of a major DeFi protocol as the capstone project.",
    priceUsdt: 79,
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&auto=format&fit=crop",
    category: "DeFi",
    tags: ["DeFi", "AMM", "Aave", "Uniswap", "Yield"],
    instructor: "Vikram Rao",
    instructorTitle: "DeFi Protocol Architect",
    duration: "24 hours",
    lessons: 96,
    level: "Advanced",
    featured: true,
    rating: 4.9,
    reviewCount: 87,
    curriculum: [
      {
        section: "AMM Architecture",
        lessons: ["Constant product formula", "Concentrated liquidity", "Fee mechanics", "Slippage and price impact"],
      },
      {
        section: "Lending Protocols",
        lessons: ["Collateral models", "Interest rate curves", "Liquidation engines", "Flash loans"],
      },
      {
        section: "Governance and DAOs",
        lessons: ["Token voting", "Timelock contracts", "Proposal systems", "Multisig coordination"],
      },
      {
        section: "Capstone: Protocol Clone",
        lessons: ["Architecture design", "Core contracts", "Frontend integration", "Security review", "Mainnet deployment"],
      },
    ],
    includes: [
      "96 video lessons · 24 hours total",
      "Full DeFi protocol source code",
      "Mainnet fork testing setup",
      "Architecture decision records",
      "Private Discord community",
      "Lifetime access and updates",
    ],
  },
  {
    id: "course-rust-04",
    slug: "rust-for-blockchain",
    title: "Rust for Blockchain Development",
    subtitle: "Write high-performance on-chain programs with Rust and Solana",
    description:
      "Learn Rust from the ground up with a blockchain focus. Build Solana programs using the Anchor framework, write SPL tokens, and deploy to devnet.",
    longDesc:
      "Rust is the language of high-performance blockchains. This course teaches Rust through the lens of blockchain development: ownership and lifetimes in the context of on-chain memory, serialization for account data, and the Anchor framework for Solana. No prior Rust knowledge needed.",
    priceUsdt: 59,
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop",
    category: "Blockchain",
    tags: ["Rust", "Solana", "Anchor", "SPL"],
    instructor: "Kenji Tanaka",
    instructorTitle: "Solana Core Contributor",
    duration: "20 hours",
    lessons: 81,
    level: "Intermediate",
    featured: false,
    rating: 4.6,
    reviewCount: 143,
    curriculum: [
      {
        section: "Rust Fundamentals",
        lessons: ["Ownership and borrowing", "Enums and pattern matching", "Traits and generics", "Error handling"],
      },
      {
        section: "Solana Architecture",
        lessons: ["Accounts model", "Programs vs contracts", "PDAs and CPIs"],
      },
      {
        section: "Anchor Framework",
        lessons: ["Account validation", "Instruction handlers", "State management", "Testing with BankRun"],
      },
    ],
    includes: [
      "81 video lessons · 20 hours total",
      "Anchor project boilerplate",
      "SPL token program from scratch",
      "Localnet and devnet deployment guides",
      "Lifetime access and updates",
    ],
  },
  {
    id: "course-audit-05",
    slug: "smart-contract-security-auditing",
    title: "Smart Contract Security Auditing",
    subtitle: "Find and fix vulnerabilities like a professional auditor",
    description:
      "A practitioner's guide to smart contract security. Learn to identify the top 20 vulnerability classes, use automated tools, and write professional audit reports.",
    longDesc:
      "Security auditing is one of the highest-paid skills in Web3. This course walks through real vulnerabilities from past exploits, teaches you to think like an attacker, and gives you a repeatable auditing process used by professional firms. Includes 10 CTF challenges to sharpen your skills.",
    priceUsdt: 69,
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80&auto=format&fit=crop",
    category: "Security",
    tags: ["Security", "Auditing", "CTF", "Slither", "Foundry"],
    instructor: "Zara Ahmed",
    instructorTitle: "Lead Auditor, Web3 Security Firm",
    duration: "16 hours",
    lessons: 64,
    level: "Advanced",
    featured: false,
    rating: 4.9,
    reviewCount: 209,
    curriculum: [
      {
        section: "Attack Taxonomy",
        lessons: ["Reentrancy and cross-function", "Integer edge cases", "Access control failures", "Oracle manipulation"],
      },
      {
        section: "Auditing Process",
        lessons: ["Scoping a codebase", "Manual review checklist", "Automated tool workflow", "Writing findings"],
      },
      {
        section: "CTF Challenges",
        lessons: ["10 progressively harder challenges", "Walkthrough videos for each"],
      },
    ],
    includes: [
      "64 video lessons · 16 hours total",
      "10 CTF challenge contracts",
      "Professional audit report template",
      "Slither and Mythril setup guides",
      "Lifetime access and updates",
    ],
  },
  {
    id: "course-zk-06",
    slug: "zero-knowledge-proofs",
    title: "Zero-Knowledge Proofs in Practice",
    subtitle: "Build zk-SNARKs and zk-STARKs for real applications",
    description:
      "Demystify zero-knowledge proofs and build real circuits with Circom and Noir. Covers the math, the tooling, and practical use cases like private voting and identity.",
    longDesc:
      "ZK proofs are the most exciting primitive in cryptography today. This course starts from the math — polynomial commitments, elliptic curves, and proof systems — then quickly gets practical with Circom circuits, Groth16 proofs, and on-chain verifiers. No cryptography background required.",
    priceUsdt: 89,
    image:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80&auto=format&fit=crop",
    category: "Cryptography",
    tags: ["ZK", "Circom", "Noir", "SNARKs", "STARKs"],
    instructor: "Elena Volkov",
    instructorTitle: "ZK Research Engineer",
    duration: "22 hours",
    lessons: 88,
    level: "Advanced",
    featured: true,
    rating: 4.8,
    reviewCount: 61,
    curriculum: [
      {
        section: "Cryptographic Foundations",
        lessons: ["Polynomial commitments", "Elliptic curve basics", "Hash functions for ZK"],
      },
      {
        section: "Proof Systems",
        lessons: ["Groth16 deep dive", "PLONK and variants", "STARKs without trusted setup"],
      },
      {
        section: "Circom and SnarkJS",
        lessons: ["Writing arithmetic circuits", "Trusted setup ceremonies", "On-chain verifier deployment"],
      },
      {
        section: "Applications",
        lessons: ["Private voting system", "ZK identity (proof of personhood)", "Rollup proof generation"],
      },
    ],
    includes: [
      "88 video lessons · 22 hours total",
      "Complete Circom circuit library",
      "4 production application examples",
      "Math reference PDF",
      "Private Discord community",
      "Lifetime access and updates",
    ],
  },
];

export const CATEGORIES = [
  "All",
  "Blockchain",
  "Web3",
  "DeFi",
  "Security",
  "Cryptography",
];

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getFeaturedCourses(): Course[] {
  return COURSES.filter((c) => c.featured);
}

export function getCoursesByCategory(cat: string): Course[] {
  if (cat === "All") return COURSES;
  return COURSES.filter((c) => c.category === cat);
}

