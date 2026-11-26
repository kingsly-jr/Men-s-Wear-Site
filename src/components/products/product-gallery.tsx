"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface GalleryImage {
  id: string;
  url: string;
  altText: string | null;
}

export function ProductGallery({
  productName,
  images,
}: {
  productName: string;
  images: GalleryImage[];
}) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [zoomed, setZoomed] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 50, y: 50 });

  const activeImage = images[activeIndex] ?? images[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  };

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {/* Thumbnails */}
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View ${productName} image ${idx + 1}`}
              className={cn(
                "relative aspect-[3/4] w-16 shrink-0 border bg-card transition-colors sm:w-full cursor-pointer",
                idx === activeIndex
                  ? "border-primary"
                  : "border-border opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Main Viewer */}
      <div
        onClick={() => setZoomed((prev) => !prev)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomed(false)}
        className={cn(
          "relative aspect-[3/4] flex-1 overflow-hidden border border-border bg-card",
          zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        )}
      >
        <AnimatePresence mode="wait">
          {activeImage ? (
            <motion.div
              key={activeImage.id}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.4 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full"
            >
              <Image
                src={activeImage.url}
                alt={activeImage.altText ?? productName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-200"
                style={{
                  transform: zoomed ? "scale(1.85)" : "scale(1)",
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((prev) => !prev);
          }}
          aria-label={zoomed ? "Zoom out product image" : "Zoom in product image"}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center border border-border bg-background/90 text-foreground hover:border-primary cursor-pointer"
        >
          {zoomed ? (
            <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}
