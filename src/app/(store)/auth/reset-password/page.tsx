"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";

type ResetValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialToken = searchParams.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: initialToken, password: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Reset failed",
        description: data?.error?.message ?? "Invalid or expired reset token.",
        variant: "error",
      });
      return;
    }

    toast({
      title: "Password updated",
      description: "Sign in with your new credentials.",
      variant: "success",
    });
    router.push("/auth/login");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Set New Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="reset-token">Reset Token</Label>
              <Input
                id="reset-token"
                className="mt-1.5 font-mono text-xs"
                {...register("token")}
              />
              {errors.token ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.token.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
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

            <Button type="submit" isLoading={isSubmitting}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center font-mono text-xs uppercase text-muted-foreground">
          Loading password reset...
        </div>
      }
    >
      <ResetPasswordContent />
    </React.Suspense>
  );
}
