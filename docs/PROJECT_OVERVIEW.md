# Project Overview — Crimson Terminal Men's Fashion Store

> **Related Documents**:
> - Detailed feature & business specifications: [`docs/PRD.md`](./PRD.md)
> - Technical architecture & database schema: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
> - UI tokens, icon/shape/motion & coding standards: [`docs/DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md)
> - Setup & Bun commands: [`README.md`](../README.md)
> - Agent rules & workflow governance: [`AGENTS.md`](../AGENTS.md)

---

## 1. Purpose & Vision

Build a **complete, production-ready, full-stack men's fashion e-commerce platform** that delivers the editorial polish of a modern luxury/street-tailoring menswear flagship alongside a rigorous, database-backed store administration system.

Unlike static templates or mock storefronts, **every customer interaction and administrative workflow is backed by PostgreSQL via Prisma ORM**, validated server-side with Zod, protected by role-based authentication (`CUSTOMER` and `ADMIN`), and verified with automated tests.

---

## 2. Visual & Brand Identity — Crimson Terminal

The visual language follows the **Crimson Terminal** design theme:
- **Atmospheric Dark Editorial**: Deep obsidian canvas (`#0A0A0A`) and charcoal surfaces (`#141414`) that make high-resolution menswear photography pop with gallery-like contrast.
- **Signature Crimson Accent**: Decisive `#DC2626` primary crimson for high-intent CTAs, active indicators, discount badges, and status highlights, paired with `#8B1A1A` accent and `#7F1D1D` destructive states.
- **Sharp Rectangular Geometry (`radius: 0rem`)**: Zero pill shapes and zero overly rounded containers. Clean `1px` structural borders (`#3F3F46`) create an architectural, brutalist-luxury editorial grid.
- **Typography**: `JetBrains Mono` for technical metadata, SKUs, prices, badges, and editorial callouts, paired with a crisp geometric sans-serif for effortless reading across product details and admin tables.

Full design tokens, spacing, icon rules, and motion guidelines are defined in [`docs/DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md).

---

## 3. Application Panels & Scope

### 3.1 Public Panel — Customer Storefront
- **Editorial Homepage**: Configurable hero campaign, featured categories (11 initial menswear categories), new arrivals, real-sales best sellers, featured collections, promotional banners, brand story, testimonials, newsletter signup, and recently viewed products.
- **Catalog & Discovery**: Full Product Listing Pages (`/shop`, `/categories/[slug]`, `/collections/[slug]`) with database-backed filtering (category, subcategory, price, size, color, availability, discount), sorting, pagination, quick view, and hover secondary image transitions.
- **Product Details (`/products/[slug]`)**: Multi-image gallery with zoom, variant selector (size/color) with live stock checks, fabric & care specs, size guide, delivery postal availability check, customer reviews, and related products.
- **Search**: Indexed database search across product names, keywords, SKUs, and categories with live suggestions and recent search history.
- **Shopping Cart & Wishlist**: Persistent cart (guest cookie cart + login merge) with server-side price/stock/coupon recalculation; authenticated persistent wishlist with move-to-cart.
- **Customer Auth & Account**: Secure registration, login, logout, email verification workflow, forgot/reset password, saved addresses, order history, cancellation requests, and return requests.
- **Checkout & Order Tracking**: Multi-step checkout with a payment-method abstraction (explicitly avoiding fake payment confirmations) and atomic database transactions.

### 3.2 Admin Panel — Store Management Dashboard (`/admin`)
- **Protected Admin Auth**: Dedicated `/admin/login`, server-verified `ADMIN` role enforcement, no public admin sign-up.
- **Real-Data Overview Dashboard**: Live revenue, order counts, customer totals, pending orders, low-stock alerts, date/month/year filters, and database-driven charts.
- **Catalog & Inventory**: Product CRUD (draft/publish, multi-variant SKUs, variant pricing/stock, bulk status updates), hierarchical Category CRUD (with safe-delete protection), Collection CRUD, and transactional Inventory Management with movement audit logs.
- **Operations & Growth**: Full Order lifecycle management (`Pending` to `Delivered`/`Cancelled`/`Returned`), cancellation/return request review, Customer management (without exposing credentials), Coupon & discount rules engine, Homepage CMS, and Store Settings.

---

## 4. 8-Phase Execution Roadmap

The project is structured into **8 verifiable phases**. Each phase requires an approved **Implementation Plan** in the editor before edits begin and concludes with a **Walkthrough** after verification:

1. **Phase 1 — Foundation, Crimson Terminal Design System & Database Architecture**: Next.js + Bun setup, Tailwind tokens (`0rem` radius), env validation, full Prisma schema & initial migration, seed script, base UI primitives, and auth/session core.
2. **Phase 2 — Core Backend Services, Validations & Auth Endpoints**: Domain service layer (`src/services/*`), Zod schemas, rate limiting, and complete customer/admin authentication APIs & actions.
3. **Phase 3 — Public Storefront (Discovery & Catalog)**: Layout/navigation, configurable homepage, PLP filtering/sorting, PDP gallery/variants/reviews, and search.
4. **Phase 4 — Public Storefront (Commerce & Account)**: Guest/auth Cart with server recalculation, Wishlist, Checkout workflow, and Customer Account & Order/Return tracking.
5. **Phase 5 — Admin Panel (Core Analytics, Catalog & Inventory)**: Admin layout/RBAC, real-data analytics dashboard, Products/Variants CRUD, Categories, Collections, and Inventory Movement console.
6. **Phase 6 — Admin Panel (Operations, Marketing & CMS)**: Orders/Cancellations/Returns management, Customer management, Coupons engine, Homepage CMS, and Store Settings.
7. **Phase 7 — Testing, SEO, Accessibility & Performance**: Unit tests, integration tests, E2E journeys, dynamic metadata/sitemap/robots/JSON-LD, WCAG checks, and Core Web Vitals optimization.
8. **Phase 8 — CI/CD & Final Production Audit**: `.github/workflows/ci.yml` (+ documented `deploy.yml` template), full end-to-end verification across every route, security check, and production build.
