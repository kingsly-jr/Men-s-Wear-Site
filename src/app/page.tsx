import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="border-b border-border pb-8">
          <div className="mb-4 flex items-center gap-3">
            <Badge variant="default">Phase 1 Foundation</Badge>
            <Badge variant="outline">Crimson Terminal v0.1</Badge>
          </div>
          <h1 className="font-mono text-3xl font-bold uppercase tracking-tight sm:text-5xl">
            CRIMSON TERMINAL
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Precision Men&apos;s Fashion E-Commerce Platform — architectural
            obsidian surfaces, 0rem editorial geometry, PostgreSQL/Prisma
            persistence, and strict RBAC separation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/api/health"
              className="inline-flex h-10 items-center gap-2 border border-primary bg-primary px-5 font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:border-accent hover:bg-accent"
            >
              <span>Inspect Health Endpoint</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>Design Tokens</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Strict 0rem sharp rectangular components, JetBrains Mono headers,
              Lucide icons exclusively, and reduced-motion aware Framer Motion.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>PostgreSQL + Prisma</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Normalized relational schema with decimal-safe pricing, variant
              SKUs, inventory movements, and immutable order snapshots.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck
                  className="h-4 w-4 text-primary"
                  strokeWidth={1.75}
                />
                <span>Session &amp; RBAC Core</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Scrypt password hashing, HTTP-only session cookies, and
              server-enforced CUSTOMER vs ADMIN route guards.
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
