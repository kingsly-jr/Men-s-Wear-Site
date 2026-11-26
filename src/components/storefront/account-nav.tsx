"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/ui/toast";

const ACCOUNT_LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile & Security", icon: UserCog },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast({ title: "Signed out", variant: "default" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      aria-label="Account navigation"
      className="flex flex-col border border-border bg-card"
    >
      {ACCOUNT_LINKS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 border-b border-border px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors",
              active
                ? "border-l-2 border-l-primary bg-background text-foreground"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-background hover:text-primary cursor-pointer"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        <span>Sign Out</span>
      </button>
    </nav>
  );
}
