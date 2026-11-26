import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";

import {
  GUEST_CART_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "./session-constants";

export { GUEST_CART_COOKIE_NAME, SESSION_COOKIE_NAME };
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Hashes an opaque session or verification token using SHA-256 keyed with AUTH_SECRET.
 */
export function hashOpaqueToken(rawToken: string): string {
  const { AUTH_SECRET } = getEnv();
  return createHash("sha256")
    .update(`${AUTH_SECRET}:${rawToken}`)
    .digest("hex");
}

/**
 * Generates a cryptographically strong URL-safe random token.
 */
export function generateOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}

/**
 * Creates a database session record and sets an HTTP-only cookie.
 */
export async function createUserSession(params: {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<{ expiresAt: Date }> {
  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt,
      userAgent: params.userAgent ?? null,
      ipAddress: params.ipAddress ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { expiresAt };
}

/**
 * Revokes the current session in the database and clears the session cookie.
 */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = hashOpaqueToken(rawToken);
    await prisma.session.deleteMany({
      where: { tokenHash },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Ensures a persistent HTTP-only guest cart token exists and returns it.
 */
export async function getOrCreateGuestCartToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
  if (existing && existing.length >= 16) {
    return existing;
  }

  const token = generateOpaqueToken(24);
  cookieStore.set(GUEST_CART_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}
