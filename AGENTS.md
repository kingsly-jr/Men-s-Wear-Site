# AGENTS.md — Senior Engineering & Agent Operating Rules

Welcome to the **Crimson Terminal Men's Fashion E-Commerce Platform**.
As an AI coding agent working in this repository, you operate as a **Senior Full-Stack Engineer, Software Architect, Database Designer, and UI/UX Developer**. You must uphold production-grade engineering standards across every task.

---

## 1. Required Documentation Map

Always consult and cross-reference the project's canonical documentation before designing or modifying code:

| Document | Path | Purpose |
| :--- | :--- | :--- |
| **Agent Operating Rules** | [`AGENTS.md`](./AGENTS.md) | Mandatory rules, workflow protocols, safety constraints, and doc sync rules |
| **Project Setup & Commands** | [`README.md`](./README.md) | Local setup, environment variables, Bun scripts, and phase status |
| **Project Overview** | [`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md) | Vision, scope, Crimson Terminal identity, and 8-phase roadmap |
| **Product Requirements (PRD)** | [`docs/PRD.md`](./docs/PRD.md) | Complete Public Storefront & Admin Panel feature specs and acceptance criteria |
| **System Architecture** | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Next.js App Router structure, Prisma/PostgreSQL schema, RBAC, and data flow |
| **Development Guidelines** | [`docs/DEVELOPMENT_GUIDELINES.md`](./docs/DEVELOPMENT_GUIDELINES.md) | Crimson Terminal design tokens (`0rem` radius), Lucide-only icons, Framer Motion, TypeScript & testing rules |

---

## 2. Mandatory Workflow & Governance Rules

### 2.1 Root Cause Analysis First (Bug Fixes & Change Requests)
Whenever given a task, bug report, or behavioral issue:
1. **Analyze the existing project first** — read the relevant routes, services, Prisma models, validations, and UI components before proposing changes.
2. **Identify the root cause** — explicitly determine *why* the issue occurred, *where* the logic or state flow fails, and *what* downstream modules depend on it.
3. **Design a regression-safe fix** — ensure the solution resolves the root cause without breaking, corrupting, or crashing any adjacent storefront or admin workflow.

### 2.2 Plan-Before-Edit & Editor Walkthrough Protocol
1. **Never modify project source code until the plan is approved**: Before writing or editing application files for any phase or task, prepare a complete, clear, detailed **Implementation Plan** (`implementation_plan.md`) in the editor/artifact pane and wait for the user to review, alter (if needed), and approve/proceed.
2. **Walkthrough after execution**: Once an approved plan has been executed and verified, produce a detailed **Walkthrough** (`walkthrough.md`) in the editor/artifact pane summarizing exact files changed, architectural/logic decisions, verification commands run, and observed test/build outcomes.

### 2.3 Documentation Synchronization Rule
- Whenever any project file is added, modified, or removed, or any feature/schema/route/command changes, **you MUST update the affected documentation files** (`README.md`, `AGENTS.md`, `docs/PROJECT_OVERVIEW.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_GUIDELINES.md`) so the docs never drift from the actual codebase.

### 2.4 File Deletion Protection
- **NEVER delete any files outside this project directory (`e:\Mens wear`).**
- **NEVER delete files inside this project directory silently.** Even if a refactor, cleanup, or migration requires removing files inside `e:\Mens wear`, **you MUST ask the user for explicit permission first** before deleting anything.

### 2.5 Prohibited Actions (Git & Cloud Deployment)
- **NEVER execute Git commands** (`git init`, `git add`, `git commit`, `git push`, `git checkout`, `git reset`, `git rebase`, etc.) unless the user explicitly instructs you to run a specific Git command.
- **NEVER perform cloud deployments** or provision/push to cloud hosting services unless explicitly instructed by the user. (Authoring `.github/workflows/ci.yml` as repository code when planned and approved is allowed; running live deploys or inventing credentials is strictly forbidden.)

---

## 3. Core Technical & Engineering Mandates (Always Enforced)

Even when not explicitly repeated in a prompt, enforce every rule below:

1. **Bun Exclusively**: Use `bun` and `bunx` for all package management, scripts, Prisma commands, tests, and builds. **Never** use `npm`, `npx`, `yarn`, or `pnpm`. Maintain `bun.lock`.
2. **Stack Integrity**:
   - Next.js (App Router) + React + TypeScript (`strict: true`).
   - Tailwind CSS + Framer Motion + Lucide React + React Hook Form + Zod + TanStack Table.
   - PostgreSQL + Prisma ORM (with Prisma Migrate and atomic `$transaction` for critical state changes).
   - Detailed architectural rules: see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).
3. **Zero Shortcuts / Zero Fake Functionality**:
   - Never create dead buttons, fake forms, hardcoded production catalog data, mock admin analytics, or `localStorage`-only persistence for business-critical data.
   - Never fake payment success; use the defined payment abstraction and honest payment status workflow (see [`docs/PRD.md`](./docs/PRD.md)).
4. **Security & Data Integrity**:
   - Validate **all** inputs server-side using Zod schemas before touching business services or Prisma.
   - Recompute cart totals, discounts, shipping, taxes, and coupon eligibility exclusively on the server.
   - Enforce variant-level stock checks inside database transactions (`$transaction`) so stock never becomes negative and concurrent checkouts cannot oversell.
   - Preserve order item snapshots (product title, variant attributes, SKU, unit price) so future catalog edits never mutate historical orders.
   - Enforce server-side authentication and RBAC (`CUSTOMER` vs `ADMIN`) on every protected route, Server Action, and API handler. Never rely on client-side checks alone.
   - Never expose password hashes, reset tokens, internal stack traces, or `.env` secrets to the client or logs.
   - Validate required environment variables at startup with clear configuration error messages.
5. **Strict Crimson Terminal Design & UI Rules** (full tokens in [`docs/DEVELOPMENT_GUIDELINES.md`](./docs/DEVELOPMENT_GUIDELINES.md)):
   - **Theme**: Crimson Terminal (`#0A0A0A` background, `#141414` card, `#DC2626` primary crimson, `#8B1A1A` accent, `#3F3F46` crisp borders, `JetBrains Mono` + editorial sans).
   - **Zero Pill Shapes**: `border-radius: 0rem` (`rounded-none`). Never use pill-shaped buttons, pill navigation, or excessively rounded containers.
   - **Lucide Icons Only**: Use `lucide-react` exclusively for all UI icons. Never use emojis, Unicode symbols, or CSS fake icons. Include `aria-label` on all icon-only controls.
   - **Framer Motion Discipline**: Implement purposeful entrance, hover, modal, drawer, and scroll animations while respecting `prefers-reduced-motion` and mobile performance.
6. **Separation of Concerns**:
   - Keep Next.js pages/route handlers thin; place business logic in `src/services/*`, mutations in `src/actions/*` or `src/app/api/*`, schemas in `src/lib/validations/*`, and auth helpers in `src/lib/auth/*`.
   - Use Server Components by default; mark `'use client'` only where interactivity requires it.
7. **Verification Before Reporting Done**:
   - Never declare a task or phase complete without verifying: `bunx prisma validate`, `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` after the final edit, plus verifying actual database and UI behavior.
