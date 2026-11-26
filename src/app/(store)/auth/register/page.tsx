"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, UserPlus } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { registerSchema } from "@/lib/validations/auth.schema";

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const nextPath = searchParams.get("next") || "/account";
  const [devVerifyToken, setDevVerifyToken] = React.useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Registration failed",
        description: data?.error?.message ?? "Please review your details.",
        variant: "error",
      });
      return;
    }

    if (data.devVerificationToken) {
      setDevVerifyToken(data.devVerificationToken);
      toast({
        title: "Account created",
        description: "Verify your email using the confirmation link below.",
        variant: "success",
      });
      return;
    }

    toast({ title: "Account created", variant: "success" });
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Create Patron Account</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Register to save items, track orders, and expedite checkout.
          </p>
        </CardHeader>
        <CardContent>
          {devVerifyToken ? (
            <div className="flex flex-col gap-4 border border-primary/50 bg-background p-4 text-xs">
              <p className="font-mono font-semibold uppercase tracking-wider text-primary">
                Account Created — Email Verification
              </p>
              <p className="text-muted-foreground">
                Verify your email address now or proceed to your account.
              </p>
              <Link
                href={`/auth/verify-email?token=${encodeURIComponent(devVerifyToken)}`}
              >
                <Button variant="primary" className="w-full">
                  Verify Email Now
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  router.push(nextPath);
                  router.refresh();
                }}
              >
                Continue to Account
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div>
                <Label htmlFor="reg-name">Full Name</Label>
                <Input
                  id="reg-name"
                  placeholder="Aarav Mehta"
                  className="mt-1.5"
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="mt-1 text-xs text-primary">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
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
                <Label htmlFor="reg-phone">Phone (Optional)</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="+91 98200 11223"
                  className="mt-1.5"
                  {...register("phone")}
                />
                {errors.phone ? (
                  <p className="mt-1 text-xs text-primary">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Minimum 8 characters"
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
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Already registered?{" "}
            <Link
              href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
              className="font-mono uppercase text-primary hover:underline"
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center font-mono text-xs uppercase text-muted-foreground">
          Loading registration terminal...
        </div>
      }
    >
      <RegisterFormContent />
    </React.Suspense>
  );
}
