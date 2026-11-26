# System Architecture — Crimson Terminal Men's Fashion Store

> **Related Documents**:
> - Feature & business requirements: [`docs/PRD.md`](./PRD.md)
> - UI design system, coding & testing standards: [`docs/DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md)
> - Setup & Bun commands: [`README.md`](../README.md)
> - Governance & safety rules: [`AGENTS.md`](../AGENTS.md)

---

## 1. Architectural Overview

The application is built on **Next.js App Router** with **TypeScript (strict mode)**, **PostgreSQL**, **Prisma ORM**, and **Bun**. It follows a modular, layered monolith architecture that cleanly separates presentation, request handling, validation, domain business logic, and persistence:

```text
Client / Browser
   │
   ├──► Next.js Middleware (src/middleware.ts) — Route protection & security headers
   │
   ├──► App Router Pages & Layouts (Server Components by default)
   │       ├── src/app/(store)/*       (Public Storefront)
   │       └── src/app/admin/*         (Protected Admin Panel)
   │
   ├──► Mutations & Endpoints
   │       ├── src/actions/*           (Next.js Server Actions)
   │       └── src/app/api/*           (Route Handlers for REST, Auth, Search, Health)
   │
   ├──► Validation & Auth Layer
   │       ├── src/lib/validations/*   (Zod schemas)
   │       └── src/lib/auth/*          (Session cookies, password hashing, RBAC guards)
   │
   ├──► Domain Services Layer (src/services/*)
   │       (Pure business logic + Prisma $transaction orchestration)
   │
   └──► PostgreSQL Database via Prisma ORM (src/lib/prisma.ts & prisma/schema.prisma)
```

**Core Architectural Rule**: Never embed raw Prisma queries, business math, or authorization logic directly inside UI components or deeply inside page files. Pages and Route Handlers delegate to `src/services/*` after validating inputs with Zod and verifying sessions via `src/lib/auth/*`.

---

## 2. Directory Structure

```text
mens-fashion-store/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Automated lint, typecheck, Prisma, test & build CI
│       └── deploy.yml                 # Deployment template (configured only with explicit host)
├── docs/                              # Project documentation
├── prisma/
│   ├── schema.prisma                  # Normalized relational schema
│   ├── migrations/                    # Prisma Migrate history
│   └── seed.ts                        # Idempotent initial data & admin seed
├── public/
│   └── images/                        # Local editorial & fallback brand assets
├── src/
│   ├── app/
│   │   ├── (store)/
│   │   │   ├── layout.tsx             # Storefront header, footer, cart/search providers
│   │   │   ├── page.tsx               # Configurable homepage
│   │   │   ├── shop/page.tsx          # Catalog PLP
│   │   │   ├── categories/[slug]/page.tsx
│   │   │   ├── collections/[slug]/page.tsx
│   │   │   ├── products/[slug]/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── wishlist/page.tsx
│   │   │   ├── auth/                  # Login, register, verify-email, forgot/reset password
│   │   │   └── account/               # Customer dashboard, profile, addresses, orders
│   │   ├── admin/
│   │   │   ├── login/page.tsx         # Dedicated admin login
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx         # Server-verified ADMIN shell + responsive sidebar
│   │   │       ├── page.tsx           # Real-data analytics overview
│   │   │       ├── products/          # List, create, edit products & variants
│   │   │       ├── categories/        # Category hierarchy CRUD
│   │   │       ├── collections/       # Collection CRUD & product assignment
│   │   │       ├── inventory/         # Stock levels & movement audit log
│   │   │       ├── orders/            # Orders, statuses, cancellations, returns
│   │   │       ├── customers/         # Customer directory & detail view
│   │   │       ├── coupons/           # Coupon & discount CRUD
│   │   │       ├── content/           # Homepage CMS & banners
│   │   │       └── settings/          # Store & admin settings
│   │   ├── api/                       # Health, auth, products, cart, search, admin endpoints
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                        # Crimson Terminal base primitives (0rem radius)
│   │   ├── layout/                    # Header, nav drawers, footer, search overlay
│   │   ├── storefront/                # Hero, banners, category/collection/story sections
│   │   ├── products/                  # Cards, filters, gallery, size guide, reviews
│   │   ├── cart/                      # Cart drawer & line items
│   │   ├── checkout/                  # Checkout stepper & address selector
│   │   └── admin/                     # Sidebar, KPI cards, charts, TanStack tables, forms
│   ├── lib/
│   │   ├── prisma.ts                  # Singleton PrismaClient
│   │   ├── env.ts                     # Startup Zod environment validation
│   │   ├── auth/                      # Password hashing, session constants/management, RBAC guards
│   │   ├── validations/               # Zod schemas per domain
│   │   ├── utils/                     # Currency, pricing math, slugs, cn helper, formatting
│   │   └── constants/                 # Order statuses, initial defaults, error codes
│   ├── services/                      # Server-side business logic
│   │   ├── product.service.ts
│   │   ├── category.service.ts
│   │   ├── collection.service.ts
│   │   ├── cart.service.ts
│   │   ├── wishlist.service.ts
│   │   ├── order.service.ts
│   │   ├── inventory.service.ts
│   │   ├── customer.service.ts
│   │   ├── coupon.service.ts
│   │   ├── analytics.service.ts
│   │   ├── content.service.ts
│   │   └── settings.service.ts
│   ├── actions/                       # Next.js Server Actions
│   ├── hooks/                         # Client hooks (debounce, reduced motion, local recent search)
│   ├── types/                         # Domain & API TypeScript definitions
│   └── middleware.ts                  # Protected route gating & security headers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── next.config.ts
└── tsconfig.json
```

---

## 3. Database Architecture (PostgreSQL + Prisma)

### 3.1 Core Design Principles
- **Primary Keys**: `String @id @default(uuid())` across all entities.
- **Monetary Precision**: `Decimal @db.Decimal(10, 2)` for all prices, subtotals, discounts, taxes, shipping, and totals. Never use floating-point numbers for money.
- **Referential Integrity & Deletion Strategy**:
  - Soft-archival (`status = ARCHIVED` or `isActive = false`) for products/users referenced by historical orders.
  - Explicit RESTRICT / safe checks on `Category` deletion when products or child categories exist.
   - Order items store immutable snapshots (`productName`, `variantSku`, `sizeName`, `colorName`, `imageUrl`, `unitPrice`, `quantity`) so catalog edits never alter past orders.
- **Indexes & Uniqueness**: Unique constraints on `User.email`, `Product.slug`, `Product.sku`, `ProductVariant.sku`, `SizeOption.code`, `ColorOption.name`, `Category.slug`, `Collection.slug`, `Coupon.code`, `Order.orderNumber`, plus composite indexes on filter/join keys.

### 3.2 Normalized Entity Groups (1NF / 2NF / 3NF)

1. **Identity & Access**
   - `User` (`id`, `email`, `name`, `phone`, `passwordHash`, `role` [`CUSTOMER` | `ADMIN`], `isActive`, `emailVerifiedAt`, `createdAt`, `updatedAt`)
   - `Session` (`id`, `userId`, `tokenHash`, `expiresAt`, `userAgent`, `ipAddress`, `createdAt`)
   - `VerificationToken` (`id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`)
   - `PasswordResetToken` (`id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`)
   - `Address` (`id`, `userId`, `fullName`, `phone`, `line1`, `line2`, `city`, `state`, `postalCode`, `country`, `isDefault`)

2. **Catalog & Merchandising**
   - `Category` (`id`, `name`, `slug`, `description`, `imageUrl`, `parentId` self-relation, `sortOrder`, `isActive`)
   - `SizeOption` (`id`, `name`, `code`, `sortOrder`) & `ColorOption` (`id`, `name`, `hexCode`)
   - `Product` (`id`, `name`, `slug`, `sku`, `description`, `fabric`, `material`, `careInstructions`, `price`, `originalPrice`, `status` [`DRAFT` | `PUBLISHED` | `ARCHIVED`], `isFeatured`, `seoTitle`, `seoDescription`, `categoryId`)
   - `ProductSpecification` (`id`, `productId`, `specKey`, `specValue`, `sortOrder`) — unique `(productId, specKey)`
   - `ProductImage` (`id`, `productId`, `url`, `altText`, `sortOrder`, `isPrimary`)
   - `ProductVariant` (`id`, `productId`, `sizeId`, `colorId`, `sku`, `priceOverride`, `stock`, `lowStockThreshold`, `isActive`) — unique `(productId, sizeId, colorId)`
   - `Collection` (`id`, `name`, `slug`, `description`, `imageUrl`, `sortOrder`, `isActive`)
   - `CollectionProduct` (`collectionId`, `productId`, `sortOrder`)
   - `ProductReview` (`id`, `productId`, `userId`, `rating`, `title`, `comment`, `isVerifiedPurchase`, `isApproved`, `createdAt`)

3. **Engagement, Cart & Wishlist**
   - `Wishlist` (`id`, `userId`) & `WishlistItem` (`id`, `wishlistId`, `productId`) — unique `(wishlistId, productId)`
   - `RecentlyViewedProduct` (`id`, `userId`, `productId`, `viewedAt`)
   - `Cart` (`id`, `userId?`, `guestToken?`, `couponId?`, `updatedAt`)
   - `CartItem` (`id`, `cartId`, `variantId`, `quantity`) — unique `(cartId, variantId)`

4. **Promotions, Orders & Inventory Audit**
   - `Coupon` (`id`, `code`, `description`, `discountType` [`PERCENTAGE` | `FIXED`], `discountValue`, `minOrderAmount`, `maxDiscountAmount`, `usageLimit`, `perCustomerLimit`, `startsAt`, `expiresAt`, `isActive`)
   - `CouponUsage` (`id`, `couponId`, `userId`, `orderId`, `usedAt`)
   - `Order` (`id`, `orderNumber`, `userId`, `status`, `subtotal`, `discountAmount`, `shippingAmount`, `taxAmount`, `totalAmount`, `internalNotes`, `placedAt`)
   - `OrderShippingAddress` (`id`, `orderId`, `fullName`, `phone`, `line1`, `line2`, `city`, `state`, `postalCode`, `country`)
   - `OrderItem` (`id`, `orderId`, `productId`, `variantId`, `productName`, `variantSku`, `sizeName`, `colorName`, `imageUrl`, `unitPrice`, `quantity`)
   - `PaymentRecord` (`id`, `orderId`, `method`, `status` [`PENDING` | `AWAITING_CONFIRMATION` | `PAID` | `FAILED` | `REFUNDED`], `amount`, `reference`, `notes`, `updatedAt`)
   - `OrderStatusHistory` (`id`, `orderId`, `fromStatus`, `toStatus`, `note`, `changedByUserId`, `createdAt`)
   - `CancellationRequest` (`id`, `orderId`, `userId`, `reason`, `status` [`PENDING` | `APPROVED` | `REJECTED`], `adminNote`, `reviewedAt`)
   - `ReturnRequest` (`id`, `orderId`, `userId`, `reason`, `status` [`PENDING` | `APPROVED` | `REJECTED` | `COMPLETED`], `adminNote`, `reviewedAt`)
   - `ReturnRequestItem` (`id`, `returnRequestId`, `orderItemId`, `quantity`, `reasonDetail`) — unique `(returnRequestId, orderItemId)`
   - `InventoryMovement` (`id`, `variantId`, `delta`, `balanceAfter`, `reason` [`RESTOCK` | `ADJUSTMENT` | `ORDER_PLACED` | `ORDER_CANCELLED` | `RETURN_APPROVED`], `referenceId`, `actorUserId`, `note`, `createdAt`)

5. **CMS, Marketing & Administration**
   - `HomepageSection` (`id`, `key`, `title`, `subtitle`, `bodyText`, `imageUrl`, `ctaLabel`, `ctaHref`, `secondaryCtaLabel`, `secondaryCtaHref`, `sortOrder`, `isVisible`)
   - `PromotionalBanner` (`id`, `title`, `subtitle`, `ctaLabel`, `ctaHref`, `imageUrl`, `placement`, `sortOrder`, `isActive`)
   - `NewsletterSubscriber` (`id`, `email`, `isActive`, `subscribedAt`)
   - `StoreSettings` (`id`, `brandName`, `contactEmail`, `contactPhone`, `storeAddress`, `currencyCode`, `currencySymbol`, `taxRatePercent`, `freeShippingThreshold`, `defaultShippingFee`, `defaultLowStockThreshold`, `returnWindowDays`)
   - `AdminActivityLog` (`id`, `adminUserId`, `action`, `entityType`, `entityId`, `details`, `createdAt`)

---

## 4. Security, Transactions & Auth Architecture

1. **Authentication & Sessions**:
   - Passwords hashed with strong cryptographic hashing (`scrypt` via Node/Bun `crypto` with per-user random salt and timing-safe comparison).
   - Opaque random session tokens stored hashed (`SHA-256`) in the `Session` table, delivered via `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookies.
   - Separate customer (`/auth/login`) and admin (`/admin/login`) entry points; `requireCustomer()` and `requireAdmin()` server helpers enforce DB session validity, expiry, `isActive`, and `role`.
2. **Checkout & Inventory Transaction Flow**:
   - Executed inside `prisma.$transaction`:
     1. Lock/read variants and verify `isActive` and `stock >= requestedQty`.
     2. Atomically decrement `ProductVariant.stock` using conditional update (`stock: { gte: qty }`) to guarantee stock never drops below `0`.
     3. Validate coupon limits (`usedCount < usageLimit`, per-user count `< perCustomerLimit`, date bounds, `minOrderAmount`).
     4. Create `Order`, `OrderItem[]`, `PaymentRecord`, `OrderStatusHistory`, `CouponUsage`, and `InventoryMovement[]`.
     5. Delete cart items for the checked-out cart.
3. **Rate Limiting & Input Safety**:
   - Sliding-window rate limiting on login, registration, password reset, and coupon probe endpoints.
   - Strict Zod validation on every Server Action and API payload; CSRF protection via SameSite cookies + Origin checks on state-changing routes.

---

## 5. CI/CD Architecture

- **CI (`.github/workflows/ci.yml`)**: Runs on pushes and PRs using `oven-sh/setup-bun`, `bun install --frozen-lockfile`, `bunx prisma validate`, `bunx prisma generate`, `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build`.
- **CD (`.github/workflows/deploy.yml`)**: Created only once a concrete target hosting environment is confirmed; never invents credentials or runs unapproved cloud deployments.
