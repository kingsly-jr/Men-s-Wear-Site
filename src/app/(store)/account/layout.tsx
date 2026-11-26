import { requireCustomer } from "@/lib/auth/guards";
import { AccountNav } from "@/components/storefront/account-nav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCustomer("/auth/login?next=/account");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 border-b border-border pb-5">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Patron Portal
        </p>
        <h1 className="mt-1 font-mono text-2xl font-bold uppercase tracking-wider">
          {user.name}
        </h1>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <AccountNav />
        </aside>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
