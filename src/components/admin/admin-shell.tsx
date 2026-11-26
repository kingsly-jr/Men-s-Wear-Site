"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LayoutTemplate,
  Layers,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/content", label: "Homepage CMS", icon: LayoutTemplate },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  adminName,
  adminEmail,
  children,
}: {
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    toast({ title: "Signed out of admin terminal" });
    router.push("/admin/login");
    router.refresh();
  };

  const renderLinks = (isCollapsed: boolean) => (
    <nav className="flex flex-1 flex-col" aria-label="Admin navigation">
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 border-b border-border px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors",
              active
                ? "border-l-2 border-l-primary bg-background text-foreground"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
            {!isCollapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r border-border bg-card transition-all duration-200 lg:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed ? (
            <Link
              href="/admin"
              className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest"
            >
              <span className="inline-block h-3 w-3 bg-primary" />
              <span>ADMIN TERMINAL</span>
            </Link>
          ) : (
            <span className="mx-auto inline-block h-3 w-3 bg-primary" />
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {renderLinks(collapsed)}

        <div className="border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-3 px-2 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {!collapsed ? <span>Storefront</span> : null}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-2 py-2 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {!collapsed ? <span>Sign Out</span> : null}
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin navigation"
              className="flex h-9 w-9 items-center justify-center border border-border lg:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Store Management Console
            </span>
          </div>

          <div className="text-right text-xs">
            <p className="font-mono font-semibold uppercase">{adminName}</p>
            <p className="text-[11px] text-muted-foreground">{adminEmail}</p>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        side="left"
        title="Admin Terminal"
      >
        <div className="flex flex-col gap-4">
          {renderLinks(false)}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 border border-border px-4 py-2.5 font-mono text-xs uppercase text-primary cursor-pointer"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            <span>Sign Out</span>
          </button>
        </div>
      </Drawer>
    </div>
  );
}
