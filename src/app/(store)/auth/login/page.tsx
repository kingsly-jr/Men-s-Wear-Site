"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { loginSchema } from "@/lib/validations/auth.schema";

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const nextPath = searchParams.get("next") || "/account";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Sign in failed",
        description: data?.error?.message ?? "Invalid email or password.",
        variant: "error",
      });
      return;
    }

    toast({ title: "Welcome back", variant: "success" });
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Patron Sign In</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Access your orders, saved addresses, and persistent wishlist.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="patron@example.com"
                className="mt-1.5"
                {...register("email")}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="font-mono text-[11px] uppercase tracking-wider text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className="mt-1.5"
                {...register("password")}
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" size="lg" isLoading={isSubmitting}>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            New to Crimson Terminal?{" "}
            <Link
              href={`/auth/register?next=${encodeURIComponent(nextPath)}`}
              className="font-mono uppercase text-primary hover:underline"
            >
              Create Account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center font-mono text-xs uppercase text-muted-foreground">
          Loading sign-in terminal...
        </div>
      }
    >
      <LoginFormContent />
    </React.Suspense>
  );
}
