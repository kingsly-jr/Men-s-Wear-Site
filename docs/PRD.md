# Product Requirements Document (PRD)

> **Related Documents**:
> - High-level scope & roadmap: [`docs/PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md)
> - Database schema, routes & service boundaries: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
> - UI theme (`Crimson Terminal`), icons & motion rules: [`docs/DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md)
> - Commands & setup: [`README.md`](../README.md)

---

## 1. User Roles & Personas

| Role | Access Scope | Authentication |
| :--- | :--- | :--- |
| **Guest Shopper** | Browse storefront, search, filter, view PDP, guest cart (cookie-backed), register/login | Unauthenticated |
| **Customer (`CUSTOMER`)** | All guest features + persistent cart/wishlist, checkout, account profile, addresses, order tracking, cancellation/return requests, product reviews | Email + password, HTTP-only session cookie, email verification workflow |
| **Administrator (`ADMIN`)** | Full access to `/admin/*` dashboard, catalog, inventory, orders, customers, coupons, homepage CMS, and store settings | Separate `/admin/login`, seeded initial admin, strict server-side RBAC |

---

## 2. Public Panel — Customer Storefront Requirements

### 2.1 Header & Navigation
- Brand identity logo, sticky navigation bar, active route indicators, desktop category mega-dropdown, mobile navigation drawer.
- Primary links: **Home**, **New Arrivals**, **Shop**, **Categories**, **Collections**, **Offers**.
- Utility actions: **Search** (overlay trigger), **Wishlist** (with count), **Account**, **Shopping Bag** (with live item count badge — rectangular, never pill-shaped).

### 2.2 Homepage (`/`)
All homepage sections must support admin visibility toggles, ordering, and dynamic content from `HomepageSection` and `PromotionalBanner` records:
1. **Hero Section**: Full-bleed fashion campaign visual, main headline, short brand introduction, primary shopping CTA, secondary collection CTA, animated entrance & subtle scroll interaction.
2. **Featured Categories**: Dynamic grid driven by active admin categories. Initial seeded categories:
   - `T-Shirts`, `Shirts`, `Polo T-Shirts`, `Jeans`, `Trousers`, `Casual Wear`, `Formal Wear`, `Jackets`, `Hoodies`, `Ethnic Wear`, `Accessories`.
3. **New Arrivals**: Latest published products showing primary image, hover secondary image, name, current price, original price, discount %, available color swatches, wishlist toggle, and product link.
4. **Best Sellers**: Ranked dynamically by actual completed/valid `OrderItem` sales quantities from PostgreSQL (never hardcoded).
5. **Featured Collections**: Admin-managed collections (initial examples: `Everyday Essentials`, `Smart Casual`, `Formal Collection`, `Weekend Collection`, `Seasonal Collection`).
6. **Trending Products & Promotional Banners**: Dynamic campaign slots with clean editorial framing.
7. **Brand Story & Customer Testimonials**: Configurable editorial blocks + verified customer review highlights.
8. **Newsletter Subscription**: Validated email capture persisted to `NewsletterSubscriber` with duplicate handling.
9. **Recently Viewed Products**: Tracked cleanly across sessions/authenticated `RecentlyViewedProduct` records.

### 2.3 Product Listing Page (`/shop`, `/categories/[slug]`, `/collections/[slug]`)
- **Database-Driven Filtering**:
  - Category & Subcategory (parent/child)
  - Price range (min/max)
  - Size & Color (variant-aware)
  - Availability (In Stock / Out of Stock)
  - Discounted / On Offer
- **Database-Driven Sorting**:
  - `Featured`, `Newest`, `Price: Low to High`, `Price: High to Low`, `Best Selling`, `Highest Discount`
- **Product Cards & Grid**:
  - Primary image + smooth hover secondary image transition
  - Product name, current price, original price, discount percentage, available color indicators, wishlist toggle, stock status
  - Quick-View modal with variant selection & Add to Cart
  - Server-backed pagination

### 2.4 Product Details Page (`/products/[slug]`)
- **Media Gallery**: Multi-image viewer, thumbnail rail, click/hover image zoom, responsive mobile swipe/tap switching.
- **Product Information & Specifications**:
  - Name, SKU, description, current price, original price, discount %
  - Interactive **Size** and **Color** variant selectors showing variant-specific price & stock availability
  - Quantity selector strictly bounded by available variant stock
  - Fabric, material, care instructions, product specifications, and **Size Guide** modal/drawer
- **Actions**: `Add to Cart`, `Buy Now` (adds validated item and routes to `/checkout`), `Add to Wishlist`.
- **Additional Features**:
  - Delivery postal/PIN code availability & estimated dispatch checker
  - Customer reviews (verified & moderated/submitted reviews)
  - Related products (same category/collection) & Recently Viewed rail

### 2.5 Search Experience (`/search` + Header Overlay)
- Indexed PostgreSQL search across product name, description, SKU, fabric, and category.
- Instant search suggestions, recent searches list, search results page supporting filters/sorting, clear search action, and structured empty/no-results state.

### 2.6 Shopping Cart (`/cart` + Slide-Over Drawer)
- Add, remove, update quantity, change variant (where applicable).
- Displays variant image, title, size/color, unit price, line total, subtotal, coupon discount, estimated shipping/tax, and final total.
- **Guest & Auth Persistence**: Guest carts persist via HTTP-only guest cart token; upon login/registration, guest cart items merge safely into the customer's DB cart with stock revalidation.
- **Server Authority**: All prices, stock limits, and coupon discounts are recalculated on the server on every mutation and before checkout.

### 2.7 Wishlist (`/wishlist`)
- Add/remove products (preventing duplicate `WishlistItem` entries via unique constraint).
- Persistent in PostgreSQL for authenticated users.
- One-click **Move to Cart** (prompts/selects variant if required).

### 2.8 Customer Authentication & Account Dashboard (`/account/*`)
- **Auth Flows**: Register, Login, Logout, Email Verification interface & token workflow, Forgot Password, Password Reset, HTTP-only session management.
- **Account Overview (`/account`)**: Summary metrics, recent orders, default shipping address.
- **Profile & Security**: Edit personal info, change password (verifies current password).
- **Saved Addresses**: Create, edit, delete, set default shipping/billing address.
- **Orders & Post-Purchase (`/account/orders`, `/account/orders/[id]`)**:
  - Order history, itemized snapshots, order status timeline (`OrderStatusHistory`), payment status.
  - Submit **Cancellation Request** (when order status is eligible, e.g., `PENDING` or `CONFIRMED`).
  - Submit **Return Request** (when order is `DELIVERED` and within configured return window).

### 2.9 Checkout (`/checkout`)
- Guided workflow:
  1. Review Cart (revalidates stock & active pricing on server)
  2. Customer & Shipping Address (select saved or enter new)
  3. Coupon Application & Order Summary (subtotal, discount, shipping, tax, final total)
  4. Payment Method Abstraction (e.g., Cash on Delivery / Manual Bank Transfer / Payment Reference Pending) — **never** marks payments as `PAID` automatically or displays fake gateway confirmations.
  5. Confirm Order -> Executes atomic Prisma `$transaction`:
     - Re-checks variant stock and prevents negative stock
     - Creates `Order`, `OrderItem` snapshots, `PaymentRecord` (`PENDING` / `AWAITING_VERIFICATION`), and initial `OrderStatusHistory`
     - Records `CouponUsage` (if coupon applied)
     - Decrements `ProductVariant.stock` and logs `InventoryMovement` (`ORDER_PLACED`)
     - Clears active cart

---

## 3. Admin Panel Requirements (`/admin`)

### 3.1 Admin Authentication (`/admin/login`)
- Dedicated admin login portal; public admin registration is strictly disabled.
- Initial administrator created via controlled seed script (`prisma/seed.ts`).
- Every admin page, Server Action, and API route validates an active session with `role === 'ADMIN'` on the server.

### 3.2 Overview Dashboard (`/admin`)
- **KPI Summary Cards** (live PostgreSQL aggregates): Total Revenue, Total Orders, Total Products, Total Customers, Pending Orders, Low Stock Products.
- **Analytics & Filtering**: Date range, monthly, and yearly views for Revenue Overview, Daily/Monthly Sales, Order Status distribution, Best-Selling Products, Top Categories, Recent Orders, and Inventory Summary. Zero mock numbers.

### 3.3 Product Management (`/admin/products`)
- TanStack Table listing with search, category/status/stock filters, sorting, pagination, bulk row selection, and bulk status updates (`PUBLISHED`, `DRAFT`, `ARCHIVED`).
- Create/Edit forms (React Hook Form + Zod): name, slug, SKU, description, category & subcategory, price, original price, discount calculation, multiple images (primary + gallery order), fabric, material, specifications, care instructions, featured flag, SEO title/description.
- **Variant Matrix**: Manage multiple sizes and colors, unique SKU per variant, variant-level stock, optional variant price override, active/inactive toggle.

### 3.4 Category & Collection Management
- **Categories (`/admin/categories`)**: Create, edit, delete, image, slug, description, display order, active/inactive status, parent/child hierarchy. **Safe Delete Rule**: Prevent deleting categories still referenced by products or child categories unless reassigned/handled explicitly.
- **Collections (`/admin/collections`)**: Create, edit, delete, image, description, slug, display order, active/inactive status, assign/remove products.

### 3.5 Inventory Management (`/admin/inventory`)
- Variant-level stock table with search and filters (`All`, `Low Stock`, `Out of Stock`).
- Transactional stock adjustment modal (add/remove/set with reason note) that atomically updates variant stock and appends an immutable `InventoryMovement` record.
- Full stock movement history log.

### 3.6 Order Management (`/admin/orders`)
- View all orders with search, status/payment filters, and pagination.
- Detailed order inspector: order number, customer info, itemized variants & quantities, subtotal, discount, shipping, tax, final total, shipping address, payment record & payment status update, internal admin notes, full status timeline.
- Update order status across valid lifecycle states: `PENDING`, `CONFIRMED`, `PROCESSING`, `READY_TO_SHIP`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED` (each transition logged in `OrderStatusHistory`).
- Review and approve/reject customer **Cancellation Requests** and **Return Requests** (approved cancellations/returns restore variant stock transactionally).

### 3.7 Customer Management (`/admin/customers`)
- Customer list with search, registration date, order count, total spent, and account status.
- Customer detail view with full order history and account activation/deactivation toggle.
- **Strict Privacy**: Never display or return customer password hashes or authentication tokens to admins.

### 3.8 Coupon & Discount Management (`/admin/coupons`)
- Full CRUD: coupon code, discount type (`PERCENTAGE` / `FIXED`), value, minimum purchase amount, maximum discount cap, global usage limit, per-customer usage limit, start date, expiration date, active status.
- Server-side validation enforces all rules and prevents duplicate/expired usage.

### 3.9 Homepage Content & Store Settings
- **Homepage CMS (`/admin/content`)**: Manage Hero headline/subtitle/CTAs/images, Promotional Banners, Featured Products/Categories/Collections, Brand Story text, section visibility toggles, and section display order.
- **Store Settings (`/admin/settings`)**: Brand name, contact email/phone, store address, currency code/symbol, tax rate, flat/free-shipping threshold, low-stock threshold, return window days, and admin profile settings.

---

## 4. Non-Functional & Acceptance Criteria

- **SEO**: Dynamic metadata per page/product, canonical URLs, Open Graph tags, `sitemap.xml`, `robots.txt`, JSON-LD `Product` schema.
- **Accessibility**: Semantic landmarks, proper `h1`-`h6` hierarchy, keyboard-navigable menus/modals, visible focus rings (`#DC2626`), alt text, ARIA labels, `prefers-reduced-motion` support.
- **Performance**: Server Components by default, indexed queries, zero N+1 queries, paginated datasets, optimized images.
- **Testing**: Unit, integration, and E2E suites covering business calculations, auth/RBAC, inventory transactions, and full shopping/admin flows (see [`docs/DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md)).
