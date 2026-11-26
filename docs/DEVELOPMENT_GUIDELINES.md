# Development Guidelines — Crimson Terminal Men's Fashion Store

> **Related Documents**:
> - Agent governance & mandatory workflow rules: [`AGENTS.md`](../AGENTS.md)
> - System architecture & database rules: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
> - Feature requirements: [`docs/PRD.md`](./PRD.md)
> - Setup & Bun commands: [`README.md`](../README.md)

---

## 1. Crimson Terminal Design System

All public storefront and admin dashboard interfaces strictly implement the **Crimson Terminal** visual language.

### 1.1 Color Tokens

| Token | CSS Variable | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `--background` | `#0A0A0A` | Primary obsidian page canvas |
| **Foreground** | `--foreground` | `#FAFAFA` | Primary body & heading text |
| **Card** | `--card` | `#141414` | Elevated product cards, panels, dashboard widgets |
| **Card Foreground** | `--card-foreground` | `#FAFAFA` | Text inside cards |
| **Primary** | `--primary` | `#DC2626` | Primary CTA buttons, active tabs, crimson badges, highlights |
| **Primary Foreground** | `--primary-foreground` | `#FFFFFF` | Text on primary crimson surfaces |
| **Secondary** | `--secondary` | `#262626` | Secondary buttons, neutral badges, surface layers |
| **Secondary Foreground** | `--secondary-foreground` | `#FAFAFA` | Text on secondary surfaces |
| **Accent** | `--accent` | `#8B1A1A` | Deep crimson hover/selected states |
| **Accent Foreground** | `--accent-foreground` | `#FAFAFA` | Text on accent surfaces |
| **Muted** | `--muted` | `#1C1C1E` | Subtle containers, skeleton loaders, table headers |
| **Muted Foreground** | `--muted-foreground` | `#A1A1AA` | Captions, metadata, helper labels |
| **Destructive** | `--destructive` | `#7F1D1D` | Delete buttons, error badges, critical warnings |
| **Destructive Foreground** | `--destructive-foreground` | `#FEE2E2` | Text on destructive surfaces |
| **Border** | `--border` | `#3F3F46` | 1px structural grid lines, inputs, cards, dividers |
| **Input** | `--input` | `#27272A` | Form field borders/fills |
| **Ring** | `--ring` | `#DC2626` | Keyboard focus ring |

### 1.2 Geometry & Border Radius (`0rem` Rule)
- **Global Radius**: `--radius: 0rem` (`rounded-none`).
- **Strictly Forbidden**:
  - Pill-shaped buttons (`rounded-full`)
  - Pill-shaped navigation links or filter chips
  - Excessively rounded modals, cards, or inputs (`rounded-xl`, `rounded-2xl`, `rounded-3xl`)
- **Required Geometry**: Clean, sharp rectangular buttons, inputs, badges, drawers, and cards with crisp `1px` borders (`border border-border`).

### 1.3 Typography
- **Monospace (`JetBrains Mono`, `--font-mono`)**: Used for navigation items, prices, SKUs, discount tags, badges, technical specs, form labels, and uppercase editorial kickers.
- **Sans-Serif (`Inter` / geometric editorial sans, `--font-sans`)**: Used for long-form product descriptions, reviews, and multi-paragraph editorial prose.
- **Scale & Hierarchy**: High-contrast headings, tight tracking on display headlines, clear tabular numbers (`tabular-nums`) for all currency amounts, quantities, and dashboard metrics.

---

## 2. Strict Icon Rules (`Lucide React` Exclusively)

1. Use genuine `lucide-react` icons for every UI action and indicator.
2. **Never** use emojis (e.g., no carts, hearts, arrows, stars, or checkmarks as emoji characters).
3. **Never** use random Unicode symbols (`★`, `→`, `✕`, `•`) or CSS-drawn fake icons.
4. Maintain consistent icon sizes (`w-4 h-4` in buttons/inputs, `w-5 h-5` in nav/cards, `w-6 h-6` in headers) and uniform stroke weight (`strokeWidth={1.5}` or `1.75`).
5. Every icon-only button **must** include an accessible `aria-label` (and `title` where helpful).

---

## 3. Framer Motion & Scroll Interaction Rules

- **Core Primitives**: Use `motion`, `AnimatePresence`, `useScroll`, `useTransform`, `whileInView`, animation `variants`, and staggered children intentionally.
- **Required Surfaces**:
  - Page/section entrances (`whileInView` with `viewport={{ once: true, amount: 0.15 }}`)
  - Hero campaign entrance & subtle parallax (`useScroll` + `useTransform`)
  - Navigation mega-dropdowns, search overlay, mobile drawer, and cart drawer (`AnimatePresence`)
  - Product card hover image transitions & micro-feedback on Add-to-Cart / Wishlist toggle
  - Admin sidebar collapse, modal transitions, and dashboard metric reveal
- **Performance & Accessibility**:
  - Animate GPU-composited properties (`transform`, `opacity`) — avoid animating layout properties (`width`, `height`, `top`, `left`) on scroll.
  - Wrap root or motion components with `<MotionConfig reducedMotion="user">` and honor `useReducedMotion()`.

---

## 4. Coding & Architecture Standards

### 4.1 TypeScript & Bun Tooling
- `strict: true`, `noUncheckedIndexedAccess: true` where practical; **zero `any` types** in application logic.
- Always run commands via `bun` / `bunx`:
  - `bun install`, `bun dev`, `bun run build`, `bun run lint`, `bun run typecheck`, `bun run test`, `bunx prisma ...`.

### 4.2 Component & Service Discipline
- **Server Components First**: Default to React Server Components (`async function Page()`). Extract interactive islands to small `'use client'` components.
- **No Logic in Pages**: Page components fetch via `src/services/*` and pass serializable props to UI components.
- **Validation Everywhere**: Share Zod schemas in `src/lib/validations/*` between React Hook Form (`zodResolver`) on the client and Server Actions / Route Handlers on the server.
- **TanStack Table**: Use `@tanstack/react-table` for admin data tables (Products, Orders, Customers, Inventory Movements, Coupons).
- **UI States**: Every async view and form must cleanly implement **Loading (skeleton)**, **Empty**, **Success**, and **Error** states.
- **No Duplicated Logic**: Extract shared price formatting, discount calculations, variant lookups, and error handling into `src/lib/utils/*` and `src/services/*`.

---

## 5. Testing Standards

Every core workflow must be covered before completion:
1. **Unit Tests (`tests/unit/*`)**: Price & discount calculations, coupon rules, cart totals, inventory delta checks, order status transition state machine, Zod validators.
2. **Integration Tests (`tests/integration/*`)**: Auth flows, RBAC guards (`ADMIN` vs `CUSTOMER`), Product/Category CRUD, Cart persistence/merge, transactional Checkout & stock deduction.
3. **E2E Tests (`tests/e2e/*`)**: Customer signup/login -> browse -> filter -> PDP variant select -> cart -> checkout -> order history; Admin login -> create product -> adjust inventory -> update order status; plus critical error paths (insufficient stock, unauthorized `/admin` access, expired coupon).
