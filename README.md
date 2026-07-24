# Archive44 — The Memory Layer of Crypto

AI-powered crypto intelligence platform that permanently archives and organizes wallets, tokens, founders, DAOs, governance, contracts, social history, and blockchain activity into one searchable knowledge base.

![Archive44](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)

## Features

- **Auth** — Email/password and Ethereum wallet-signature sign-in (NextAuth/Auth.js), with optional GitHub/Google OAuth
- **AI Search** — Database-backed search across wallets, tokens, protocols, and founders (`/api/v1/search`); connect a real LLM provider for generative summaries in production
- **Entity Profiles** — Wallets, Tokens, Protocols, Founders, rendered from Postgres via Prisma
- **Risk Scoring** — Stored per-entity, surfaced as Low/Medium/High badges
- **Saved Wallets/Tokens & Alerts** — Persisted per user
- **Crypto-Native Payments** — Pay in ETH from an injected wallet (MetaMask, etc.); the backend verifies the on-chain transaction before activating the Pro plan. USDT and other chains are not yet wired up.
- **REST API** — `/api/v1/search` supports API-key auth (`Authorization: Bearer <key>`) for Pro/Enterprise access, in addition to first-party session auth
- **Dashboard** — Real per-user stats (searches, saved entities, active alerts) and subscription plan

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animation**: Framer Motion
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js / Auth.js
- **Crypto**: viem + wagmi (wallet connection & payments)
- **Deployment**: Vercel / Docker

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm / pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/0xShade404/Archive44.git
cd Archive44

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure DATABASE_URL and NEXTAUTH_SECRET in .env

# Generate Prisma client & push schema
npm run db:generate
npm run db:push

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker-compose up -d
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/              # API routes
│   ├── auth/             # Sign in / Sign up / Forgot password
│   ├── dashboard/        # User dashboard
│   ├── search/           # AI Search
│   ├── wallet/[address]/# Wallet profiles
│   ├── token/[address]/ # Token profiles
│   ├── protocol/[slug]/ # Protocol profiles
│   ├── founder/[slug]/  # Founder profiles
│   ├── pricing/          # Pricing & crypto payments
│   ├── api-docs/         # API documentation
│   └── ...
├── components/
│   ├── ui/               # Reusable UI primitives
│   ├── layout/           # Navbar, Footer
│   └── ...
├── lib/                  # Utilities, Prisma client
└── hooks/                # React hooks
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Sample data
```

## Crypto Payments

Payment flow (Pro plan, ETH only today):

1. Sign in, then connect an injected wallet (e.g. MetaMask) from the Pricing page
2. Send the required ETH amount (`NEXT_PUBLIC_PRO_PLAN_ETH`) to `PAYMENT_WALLET_ETH`
3. The backend verifies the transaction on-chain (recipient, amount, confirmation) via `ETH_RPC_URL`
4. Subscription is upgraded to Pro for 30 days once verified

USDT and additional chains (Base, Arbitrum, Optimism, Solana, BNB) are not implemented yet.

## Environment Variables

See `.env.example` for the full list.

Required:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

To enable crypto payments, also set `PAYMENT_WALLET_ETH` and `ETH_RPC_URL`. To enable password-reset emails, set `RESEND_API_KEY` (otherwise reset links are logged to the server console).

## Health Check

`GET /api/health` reports `{ status, database }` — used by the Docker `HEALTHCHECK`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |

## License

Proprietary — All rights reserved.

---

**Archive44** — The Memory Layer of Crypto.
