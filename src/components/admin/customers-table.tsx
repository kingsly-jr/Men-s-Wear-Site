"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export function CustomersTable({
  initialCustomers,
}: {
  initialCustomers: AdminCustomerRow[];
}) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return initialCustomers;
    const q = search.trim().toLowerCase();
    return initialCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [initialCustomers, search]);

  return (
    <div className="flex flex-col gap-5">
      <div className="border-b border-border pb-4">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Customers ({initialCustomers.length})
        </h1>
        <p className="text-xs text-muted-foreground">
          Registered patron directory, order history, and account status
          controls. Password credentials are never exposed.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
          strokeWidth={1.75}
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer name or email..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Customer Directory ({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted font-mono uppercase text-muted-foreground">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3 text-right">Total Spent</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-background/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {c.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isActive ? "default" : "destructive"}>
                      {c.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">
                    {c.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {formatCurrency(c.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      aria-label={`Inspect ${c.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-primary"
                    >
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
