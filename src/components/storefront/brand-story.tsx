"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Quote, Shield, Sparkles, Truck } from "lucide-react";

export interface BannerData {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

export interface ReviewTestimonial {
  id: string;
  title: string;
  comment: string;
  rating: number;
  authorName: string;
  productName: string;
}

export function BrandStoryAndBanners({
  story,
  banners,
  testimonials,
}: {
  story: {
    title: string;
    subtitle: string | null;
    bodyText: string | null;
  } | null;
  banners: BannerData[];
  testimonials: ReviewTestimonial[];
}) {
  return (
    <>
      {banners.length > 0 ? (
        <section className="border-b border-border bg-primary/10 py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="flex flex-col items-start justify-between gap-4 border border-primary/50 bg-card p-6 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-mono text-base font-bold uppercase tracking-wider text-foreground">
                    {banner.title}
                  </h3>
                  {banner.subtitle ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {banner.subtitle}
                    </p>
                  ) : null}
                </div>
                {banner.ctaHref ? (
                  <Link
                    href={banner.ctaHref}
                    className="inline-flex h-10 shrink-0 items-center gap-2 border border-primary bg-primary px-5 font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-accent"
                  >
                    <span>{banner.ctaLabel ?? "Explore Offer"}</span>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {story ? (
        <section className="border-b border-border bg-background py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-6"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-primary">
                Brand Manifesto
              </p>
              <h2 className="mt-2 font-mono text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                {story.title}
              </h2>
              {story.subtitle ? (
                <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {story.subtitle}
                </p>
              ) : null}
              {story.bodyText ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {story.bodyText}
                </p>
              ) : null}
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-6">
              <div className="border border-border bg-card p-5">
                <Sparkles
                  className="mb-3 h-5 w-5 text-primary"
                  strokeWidth={1.75}
                />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
                  High-GSM Textiles
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Combed organic cottons and virgin merino wools milled for
                  longevity.
                </p>
              </div>
              <div className="border border-border bg-card p-5">
                <Truck
                  className="mb-3 h-5 w-5 text-primary"
                  strokeWidth={1.75}
                />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Tracked Dispatch
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Real-time order progression and transparent delivery updates.
                </p>
              </div>
              <div className="border border-border bg-card p-5">
                <Shield
                  className="mb-3 h-5 w-5 text-primary"
                  strokeWidth={1.75}
                />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
                  14-Day Returns
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Seamless cancellation and return requests directly from your
                  account.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section className="border-b border-border bg-card py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="mb-8 font-mono text-xl font-bold uppercase tracking-wider">
              Verified Patron Reviews
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between border border-border bg-background p-5"
                >
                  <div>
                    <Quote
                      className="mb-3 h-4 w-4 text-primary"
                      strokeWidth={1.75}
                    />
                    <p className="font-mono text-xs font-semibold uppercase tracking-wider">
                      {item.title}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.comment}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-border pt-3 font-mono text-[11px] uppercase text-muted-foreground">
                    {item.authorName} &mdash; {item.productName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
