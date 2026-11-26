"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ShieldAlert } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { loginSchema } from "@/lib/validations/auth.schema";

type LoginValues = z.infer<typeof loginSchema>;

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const nextPath = searchParams.get("next") || "/admin";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Access denied",
        description:
          data?.error?.message ?? "Invalid administrator credentials.",
        variant: "error",
      });
      return;
    }

    toast({ title: "Administrator session active", variant: "success" });
    router.push(nextPath);
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-primary">
            <span className="inline-block h-2.5 w-2.5 bg-primary" />
            <span>CRIMSON TERMINAL // ADMIN</span>
          </div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Administrator Sign In</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Restricted store management terminal. Role verification enforced
            server-side.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="admin-email">Administrator Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@crimsonterminal.store"
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
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
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
              <span>Enter Console</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background font-mono text-xs uppercase text-muted-foreground">
          Initializing admin terminal...
        </div>
      }
    >
      <AdminLoginForm />
    </React.Suspense>
  );
}
