"use client";

import * as React from "react";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ResendVerificationBanner() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [devToken, setDevToken] = React.useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error",
          description: data?.error?.message ?? "Unable to send verification.",
          variant: "error",
        });
        return;
      }
      if (data.devVerificationToken) {
        setDevToken(data.devVerificationToken);
      }
      toast({
        title: "Verification link issued",
        variant: "success",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between gap-3 border border-primary/60 bg-primary/10 p-4 text-xs sm:flex-row sm:items-center">
      <div className="flex items-start gap-2.5">
        <MailWarning
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          strokeWidth={1.75}
        />
        <div>
          <p className="font-mono font-semibold uppercase tracking-wider">
            Email Verification Pending
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Verify your email to secure order notifications and account
            recovery.
          </p>
          {devToken ? (
            <Link
              href={`/auth/verify-email?token=${encodeURIComponent(devToken)}`}
              className="mt-1 inline-block font-mono uppercase text-primary underline"
            >
              Verify Email Now
            </Link>
          ) : null}
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        isLoading={loading}
        onClick={handleResend}
      >
        Resend Link
      </Button>
    </div>
  );
}
