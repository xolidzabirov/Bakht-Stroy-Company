"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";

/**
 * Full-width carousel of admin banners (1920×600). Banners usually carry their own text,
 * so nothing is drawn on top of the picture. Auto-play every 6 seconds.
 */
export function BannerSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count < 2) return;

    const timer = setInterval(() => setIndex((value) => (value + 1) % count), 6000);

    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const go = (step: number) => setIndex((value) => (value + step + count) % count);

  return (
    <div className="group relative">
      <div className="relative aspect-[16/7] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted sm:aspect-[16/5]">
        {banners.map((banner, i) => {
          const picture = banner.image ?? banner.image_mobile;
          const slide = picture ? (
            <Image src={picture} alt={banner.title} fill priority={i === 0} sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
          ) : (
            <span className="grid size-full place-items-center bg-ink p-6 text-center font-display text-2xl font-extrabold text-white">
              {banner.title}
            </span>
          );

          return (
            <div
              key={banner.id}
              className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "pointer-events-none opacity-0")}
              aria-hidden={i !== index}
            >
              {banner.link ? (
                <Link href={banner.link} aria-label={banner.title} className="block size-full">
                  {slide}
                </Link>
              ) : (
                slide
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Назад"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition hover:bg-brand sm:grid"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Вперёд"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition hover:bg-brand sm:grid"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="mt-3 flex justify-center gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Баннер ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-8 bg-brand" : "w-3 bg-border")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
