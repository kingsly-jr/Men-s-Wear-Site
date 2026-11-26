"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialToken = searchParams.get("token") ?? "";
  const [token, setToken] = React.useState(initialToken);
  const [verified, setVerified] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const submitToken = React.useCallback(
    async (value: string) => {
      if (!value.trim()) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: value.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({
            title: "Verification failed",
            description: data?.error?.message ?? "Invalid or expired token.",
            variant: "error",
          });
          return;
        }
        setVerified(true);
        toast({ title: "Email verified", variant: "success" });
      } finally {
        setSubmitting(false);
      }
    },
    [toast]
  );

  React.useEffect(() => {
    if (initialToken) {
      submitToken(initialToken);
    }
  }, [initialToken, submitToken]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Email Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verified ? (
            <div className="flex flex-col items-start gap-4 text-xs">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2
                  className="h-5 w-5 text-primary"
                  strokeWidth={1.75}
                />
                <span>Your email address has been verified.</span>
              </p>
              <Link href="/account" className="w-full">
                <Button className="w-full">Go to Account</Button>
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitToken(token);
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <Label htmlFor="verify-token">Verification Token</Label>
                <Input
                  id="verify-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste verification token"
                  className="mt-1.5 font-mono text-xs"
                />
              </div>
              <Button type="submit" isLoading={submitting}>
                Verify Email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center font-mono text-xs uppercase text-muted-foreground">
          Checking verification token...
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
