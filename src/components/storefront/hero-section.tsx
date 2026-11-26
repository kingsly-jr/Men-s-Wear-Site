"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface HeroSectionData {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
}

export function HeroSection({ section }: { section: HeroSectionData }) {
  const containerRef = React.useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden border-b border-border bg-background"
    >
      <div className="mx-auto grid max-w-7xl lg:grid-cols-12">
        {/* Editorial Copy */}
        <div className="relative z-10 flex flex-col justify-center px-4 py-16 sm:px-6 lg:col-span-6 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 flex items-center gap-2"
          >
            <Badge variant="default">New Season Flagship</Badge>
            <Badge variant="outline">Autumn / Winter</Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-mono text-3xl font-bold uppercase leading-[1.08] tracking-tight text-foreground sm:text-5xl"
          >
            {section.title}
          </motion.h1>

          {section.subtitle ? (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              {section.subtitle}
            </motion.p>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href={section.ctaHref ?? "/shop"}
              className="inline-flex h-12 items-center gap-2 border border-primary bg-primary px-6 font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:border-accent hover:bg-accent"
            >
              <span>{section.ctaLabel ?? "Shop New Arrivals"}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <Link
              href={section.secondaryCtaHref ?? "/collections"}
              className="inline-flex h-12 items-center gap-2 border border-border bg-card px-6 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-primary"
            >
              <span>{section.secondaryCtaLabel ?? "Explore Collections"}</span>
            </Link>
          </motion.div>
        </div>

        {/* Campaign Image */}
        <div className="relative min-h-[380px] overflow-hidden border-t border-border bg-card lg:col-span-6 lg:min-h-[600px] lg:border-l lg:border-t-0">
          {section.imageUrl ? (
            <motion.div
              style={{ y: imageY }}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative h-[114%] w-full -top-[7%]"
            >
              <Image
                src={section.imageUrl}
                alt={section.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
