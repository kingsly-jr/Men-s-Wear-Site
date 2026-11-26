import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary text-primary-foreground border-primary",
  secondary: "bg-secondary text-secondary-foreground border-border",
  outline: "bg-transparent text-foreground border-border",
  destructive: "bg-destructive text-destructive-foreground border-destructive",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
