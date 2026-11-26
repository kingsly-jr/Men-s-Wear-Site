"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { forgotPasswordSchema } from "@/lib/validations/auth.schema";

type ForgotValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [devResetToken, setDevResetToken] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotValues) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Request failed",
        description: data?.error?.message ?? "Please try again later.",
        variant: "error",
      });
      return;
    }

    setSubmitted(true);
    if (data.devResetToken) {
      setDevResetToken(data.devResetToken);
    }
    toast({
      title: "Instructions issued",
      description: data.message,
      variant: "success",
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Reset Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col gap-4 text-xs">
              <p className="text-muted-foreground">
                If an active account matches that email, password reset
                instructions have been issued.
              </p>
              {devResetToken ? (
                <Link
                  href={`/auth/reset-password?token=${encodeURIComponent(devResetToken)}`}
                >
                  <Button variant="primary" className="w-full">
                    Proceed to Reset Password
                  </Button>
                </Link>
              ) : null}
              <Link
                href="/auth/login"
                className="font-mono uppercase text-primary hover:underline"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div>
                <Label htmlFor="forgot-email">Account Email</Label>
                <Input
                  id="forgot-email"
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
              <Button type="submit" isLoading={isSubmitting}>
                Send Reset Instructions
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
