# Crimson Terminal — Premium Men's Fashion E-Commerce Platform

A full-stack, production-grade men's fashion e-commerce platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Prisma ORM**, **PostgreSQL**, and **Bun**, featuring an editorial **Crimson Terminal** visual identity (`0rem` sharp geometry, obsidian surfaces, crimson accents, and `JetBrains Mono` typography).

The application provides two tightly integrated, strictly separated panels:
1. **Public Panel (Customer Storefront)** — Editorial browsing, category & collection discovery, live indexed search, multi-facet filtering, variant-aware PDP, guest/authenticated cart & wishlist, checkout workflow, and customer order/return tracking.
2. **Admin Panel (`/admin`)** — Server-protected store management dashboard with real PostgreSQL analytics, product/variant/SKU CRUD, hierarchical categories, collections, transactional inventory tracking, order & return lifecycle management, customer management, coupons, homepage CMS, and store settings.

---

## Documentation Index

| Document | Description |
| :--- | :--- |
| [`AGENTS.md`](./AGENTS.md) | Senior engineering rules, plan/walkthrough workflow, safety & doc sync mandates |
| [`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md) | Project purpose, scope, Crimson Terminal theme, and 8-phase roadmap |
| [`docs/PRD.md`](./docs/PRD.md) | Complete feature specifications and acceptance criteria |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Next.js App Router architecture, Prisma/PostgreSQL schema, RBAC, and CI/CD |
| [`docs/DEVELOPMENT_GUIDELINES.md`](./docs/DEVELOPMENT_GUIDELINES.md) | Crimson Terminal tokens, UI/icon/motion rules, TypeScript & testing standards |

---

## Tech Stack

- **Runtime & Package Manager**: Bun (`bun` / `bunx` exclusively)
- **Framework**: Next.js (App Router), React, TypeScript (`strict: true`)
- **Styling & UI**: Tailwind CSS, Crimson Terminal Design System (`radius: 0rem`), Lucide React
- **Motion**: Framer Motion (`whileInView`, `AnimatePresence`, `useScroll`, `useTransform`)
- **Forms & Tables**: React Hook Form, Zod, TanStack Table
- **Database**: PostgreSQL + Prisma ORM + Prisma Migrate

---

## Prerequisites

- **Bun** `>= 1.1` (verified with `bun --version`)
- **PostgreSQL** `>= 15` (local instance or isolated database connection string)

---

## Environment Setup

1. Copy `.env.example` to `.env` once Phase 1 initializes the environment template:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Configure the required environment variables in `.env`:
   - `DATABASE_URL` — PostgreSQL pooled/runtime connection string
   - `DIRECT_URL` — PostgreSQL direct connection string (for Prisma migrations)
   - `AUTH_SECRET` — Cryptographically strong secret for session signing
   - `NEXT_PUBLIC_APP_URL` — Base URL (e.g., `http://localhost:3000`)
   - `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — Controlled initial admin bootstrap credentials (never exposed publicly)

> Never commit `.env` or real secrets to version control. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for environment validation details.

---

## Required Bun Commands

> **Strict Rule**: Use `bun` / `bunx` exclusively. Do not use `npm`, `npx`, `yarn`, or `pnpm`.

```bash
# Install dependencies (from bun.lock)
bun install

# Generate Prisma Client & apply database migrations
bunx prisma generate
bunx prisma migrate dev

# Seed initial admin, categories, collections, products, and store settings
bunx prisma db seed

# Start development server
bun dev

# Quality & verification gates
bun run lint
bun run typecheck
bun run test
bun run build

# Start production server
bun run start

# Inspect database via Prisma Studio
bunx prisma studio
```

---

## Project Structure (Target Architecture)

```text
mens-fashion-store/
├── .github/workflows/       # CI & deployment workflow definitions
├── docs/                    # Project Overview, PRD, Architecture, Dev Guidelines
├── prisma/                  # Prisma schema, migrations, and seed script
├── public/                  # Static imagery and brand assets
├── src/
│   ├── app/
│   │   ├── (store)/         # Public storefront routes
│   │   ├── admin/           # Protected admin login & dashboard routes
│   │   └── api/             # REST / webhook / auth route handlers
│   ├── components/          # UI primitives, layout, storefront, product, cart, checkout, admin
│   ├── services/            # Server-side domain & database business logic
│   ├── actions/             # Next.js Server Actions
│   ├── lib/                 # Prisma client, env validation, auth/RBAC, Zod schemas, utils
│   ├── hooks/               # Reusable client hooks
│   ├── types/               # Shared TypeScript interfaces & DTOs
│   └── middleware.ts        # Edge/request route guard & security headers
├── tests/                   # Unit, integration, and E2E tests
├── AGENTS.md                # Agent governance & engineering rules
└── README.md                # Setup & command reference
```

---

## Implementation Phase Status

| Phase | Scope | Status |
| :--- | :--- | :--- |
| **Phase 0** | Documentation & Governance Setup (`AGENTS.md`, `README.md`, `docs/*`) | Complete |
| **Phase 1** | Foundation, Crimson Terminal Design System, Normalized 3NF Prisma Schema & `Mens-wear-db` Seed | Complete |
| **Phase 2** | Backend Services, Zod Validations, Rate Limiting & Auth Endpoints | Complete |
| **Phase 3** | Public Storefront — Homepage, Navigation, Catalog, PDP & Search | Complete |
| **Phase 4** | Public Storefront — Cart, Wishlist, Checkout & Customer Account | Complete |
| **Phase 5** | Admin Panel — Auth, Real Analytics Dashboard, Products, Categories, Collections & Inventory | Pending |
| **Phase 6** | Admin Panel — Orders, Customers, Coupons, Homepage CMS & Store Settings | Pending |
| **Phase 7** | Unit, Integration & E2E Testing, SEO, Accessibility & Performance | Pending |
| **Phase 8** | GitHub Actions CI/CD Workflows & Final Production Audit | Pending |
