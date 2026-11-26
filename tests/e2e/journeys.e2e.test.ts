import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawn, type Subprocess } from "bun";
import { prisma } from "../../src/lib/prisma";

const PORT = 3199;
const BASE_URL = `http://127.0.0.1:${PORT}`;
let serverProc: Subprocess | null = null;

class CookieJar {
  private cookies = new Map<string, string>();

  capture(res: Response) {
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [];
    for (const raw of setCookies) {
      const pair = raw.split(";")[0];
      if (!pair) continue;
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) continue;
      const name = pair.slice(0, eqIdx).trim();
      const value = pair.slice(eqIdx + 1).trim();
      if (value === "" || raw.toLowerCase().includes("max-age=0")) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  header(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
}

async function waitForServerReady(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("Next.js E2E server did not start within timeout.");
}

const cleanupEmails: string[] = [];
const cleanupOrderIds: string[] = [];

beforeAll(async () => {
  serverProc = spawn(["bun", "run", "start", "--", "-p", String(PORT)], {
    cwd: process.cwd(),
    stdout: "ignore",
    stderr: "ignore",
    env: { ...process.env, NEXT_PUBLIC_APP_URL: BASE_URL },
  });
  await waitForServerReady();
});

afterAll(async () => {
  if (serverProc) {
    serverProc.kill();
  }
  for (const orderId of cleanupOrderIds) {
    await prisma.inventoryMovement.deleteMany({
      where: { referenceId: orderId },
    });
    await prisma.order.deleteMany({ where: { id: orderId } });
  }
  for (const email of cleanupEmails) {
    await prisma.user.deleteMany({ where: { email } });
  }
  await prisma.$disconnect();
});

describe("End-to-End Storefront & Admin Journeys", () => {
  test("public pages and health endpoint render cleanly", async () => {
    const [homeRes, shopRes, healthRes, sitemapRes, robotsRes] =
      await Promise.all([
        fetch(`${BASE_URL}/`),
        fetch(`${BASE_URL}/shop`),
        fetch(`${BASE_URL}/api/health`),
        fetch(`${BASE_URL}/sitemap.xml`),
        fetch(`${BASE_URL}/robots.txt`),
      ]);

    expect(homeRes.status).toBe(200);
    expect(shopRes.status).toBe(200);
    expect(healthRes.status).toBe(200);
    expect(sitemapRes.status).toBe(200);
    expect(robotsRes.status).toBe(200);
  });

  test("unauthenticated requests to /account and /admin redirect to login", async () => {
    const accRes = await fetch(`${BASE_URL}/account`, { redirect: "manual" });
    const admRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    expect(accRes.status).toBe(307);
    expect(admRes.status).toBe(307);
  });

  test("customer registration -> browse -> cart -> coupon -> checkout -> admin RBAC block -> admin login & order status update", async () => {
    const customerJar = new CookieJar();
    const uniqueEmail = `e2e-${Date.now()}@crimsonterminal.store`;
    cleanupEmails.push(uniqueEmail);

    // 1. Register customer
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        name: "E2E Patron",
        email: uniqueEmail,
        password: "E2EPassword123!",
      }),
    });
    customerJar.capture(regRes);
    expect(regRes.status).toBe(201);

    // 2. Customer cannot access admin API
    const forbiddenRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Cookie: customerJar.header() },
    });
    expect(forbiddenRes.status).toBe(403);

    // 3. Pick a published product variant from /api/products
    const prodListRes = await fetch(`${BASE_URL}/api/products?sort=featured`);
    expect(prodListRes.status).toBe(200);
    const prodList = (await prodListRes.json()) as {
      items: { slug: string }[];
    };
    expect(prodList.items.length).toBeGreaterThan(0);

    const detailRes = await fetch(
      `${BASE_URL}/api/products/${prodList.items[0]!.slug}`
    );
    const detail = (await detailRes.json()) as {
      variants: { id: string; stock: number }[];
    };
    const variant = detail.variants.find((v) => v.stock >= 2);
    expect(variant).toBeDefined();

    // 4. Add to cart & test invalid coupon error
    const addRes = await fetch(`${BASE_URL}/api/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
        Cookie: customerJar.header(),
      },
      body: JSON.stringify({ variantId: variant!.id, quantity: 1 }),
    });
    expect(addRes.status).toBe(200);

    const badCouponRes = await fetch(`${BASE_URL}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
        Cookie: customerJar.header(),
      },
      body: JSON.stringify({ code: "NONEXISTENT99" }),
    });
    expect(badCouponRes.status).toBe(400);

    // 5. Place order via checkout
    const checkoutRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
        Cookie: customerJar.header(),
      },
      body: JSON.stringify({
        paymentMethod: "CASH_ON_DELIVERY",
        shippingAddress: {
          fullName: "E2E Patron",
          phone: "9820011223",
          line1: "42 Crimson Road",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
      }),
    });
    expect(checkoutRes.status).toBe(201);
    const orderData = (await checkoutRes.json()) as { order: { id: string } };
    cleanupOrderIds.push(orderData.order.id);

    // 6. Verify customer order history includes new order
    const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: customerJar.header() },
    });
    const ordersJson = (await ordersRes.json()) as {
      orders: { id: string }[];
    };
    expect(ordersJson.orders.some((o) => o.id === orderData.order.id)).toBe(
      true
    );

    // 7. Admin login & cancel test order (restoring stock)
    const adminJar = new CookieJar();
    const adminEmail =
      process.env.ADMIN_SEED_EMAIL ?? "admin@crimsonterminal.store";
    const adminPassword =
      process.env.ADMIN_SEED_PASSWORD ?? "ChangeMeImmediately123!";

    const adminLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    adminJar.capture(adminLoginRes);
    expect(adminLoginRes.status).toBe(200);

    const cancelOrderRes = await fetch(
      `${BASE_URL}/api/admin/orders/${orderData.order.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: BASE_URL,
          Cookie: adminJar.header(),
        },
        body: JSON.stringify({
          action: "status",
          status: "CANCELLED",
          note: "E2E test cleanup",
        }),
      }
    );
    expect(cancelOrderRes.status).toBe(200);
  });
});
