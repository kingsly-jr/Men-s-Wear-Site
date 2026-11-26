import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AuthError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/constants/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createUserSession,
  destroyCurrentSession,
  generateOpaqueToken,
  hashOpaqueToken,
} from "@/lib/auth/session";
import { mergeGuestCartToUser } from "./cart.service";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  emailVerifiedAt: Date | null;
}

export async function registerCustomer(params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  guestCartToken?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<{ user: SanitizedUser; verificationToken: string }> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(params.password);
  const rawVerificationToken = generateOpaqueToken(32);
  const verificationTokenHash = hashOpaqueToken(rawVerificationToken);

  const user = await prisma.user.create({
    data: {
      name: params.name.trim(),
      email: normalizedEmail,
      phone: params.phone?.trim() || null,
      passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      verificationTokens: {
        create: {
          tokenHash: verificationTokenHash,
          expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerifiedAt: true,
    },
  });

  await createUserSession({
    userId: user.id,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
  });

  await mergeGuestCartToUser({
    guestToken: params.guestCartToken,
    userId: user.id,
  });

  return { user, verificationToken: rawVerificationToken };
}

export async function loginCustomer(params: {
  email: string;
  password: string;
  guestCartToken?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<SanitizedUser> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    throw new AuthError("Invalid email or password.");
  }

  const valid = await verifyPassword(params.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password.");
  }

  await createUserSession({
    userId: user.id,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
  });

  await mergeGuestCartToUser({
    guestToken: params.guestCartToken,
    userId: user.id,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

export async function loginAdmin(params: {
  email: string;
  password: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<SanitizedUser> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive || user.role !== UserRole.ADMIN) {
    throw new AuthError("Invalid administrator credentials.");
  }

  const valid = await verifyPassword(params.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid administrator credentials.");
  }

  await createUserSession({
    userId: user.id,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

export async function logoutUser(): Promise<void> {
  await destroyCurrentSession();
}

export async function verifyEmailWithToken(rawToken: string): Promise<void> {
  const tokenHash = hashOpaqueToken(rawToken);
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new ValidationError("Verification token is invalid or expired.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

export async function resendVerificationToken(
  userId: string
): Promise<{ verificationToken: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, emailVerifiedAt: true },
  });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }
  if (user.emailVerifiedAt) {
    throw new ValidationError("Email address is already verified.");
  }

  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawToken);

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  return { verificationToken: rawToken };
}

export async function requestPasswordReset(email: string): Promise<{
  issued: boolean;
  resetToken?: string;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, isActive: true },
  });

  // Never reveal whether an email exists to unauthenticated callers
  if (!user || !user.isActive) {
    return { issued: false };
  }

  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  return { issued: true, resetToken: rawToken };
}

export async function resetPasswordWithToken(params: {
  token: string;
  newPassword: string;
}): Promise<void> {
  const tokenHash = hashOpaqueToken(params.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new ValidationError("Password reset token is invalid or expired.");
  }

  const passwordHash = await hashPassword(params.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({
      where: { userId: record.userId },
    }),
  ]);
}

export async function changePassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }

  const matches = await verifyPassword(
    params.currentPassword,
    user.passwordHash
  );
  if (!matches) {
    throw new AuthError("Current password is incorrect.");
  }

  const newHash = await hashPassword(params.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });
}
