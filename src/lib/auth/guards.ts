import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashOpaqueToken, SESSION_COOKIE_NAME } from "./session";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt: Date | null;
}

/**
 * Resolves the currently authenticated, active user from the HTTP-only session cookie.
 * Returns null if unauthenticated, expired, or deactivated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return null;
  }

  const tokenHash = hashOpaqueToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    return null;
  }

  return session.user;
}

/**
 * Server guard for customer-protected pages and actions.
 */
export async function requireCustomer(redirectPath = "/auth/login"): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectPath);
  }
  return user;
}

/**
 * Server guard for admin-only pages, actions, and endpoints.
 */
export async function requireAdmin(redirectPath = "/admin/login"): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    redirect(redirectPath);
  }
  return user;
}

/**
 * API route helper returning the admin user or throwing an authorization error.
 */
export async function assertAdminApi(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.role !== UserRole.ADMIN) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
