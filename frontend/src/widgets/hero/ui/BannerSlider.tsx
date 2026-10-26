"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";

const AUTOPLAY_MS = 6000;

/**
 * Full-width carousel of admin banners (1920×600). Slides move sideways with a soft ease,
 * the picture zooms in slightly while it is shown. Auto-play pauses on hover; swipe works on phones.
 */
export function BannerSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((step: number) => setIndex((value) => (value + step + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;

    const timer = setTimeout(() => go(1), AUTOPLAY_MS);

    return () => clearTimeout(timer);
  }, [count, paused, index, go]);

  if (count === 0) return null;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => (touchX.current = event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const delta = event.changedTouches[0].clientX - touchX.current;
        if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="relative aspect-[16/7] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted sm:aspect-[16/5]">
        <div
          className="flex h-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((banner, i) => {
            const picture = banner.image ?? banner.image_mobile;
            const slide = picture ? (
              <Image
                src={picture}
                alt={banner.title}
                fill
                priority={i === 0}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className={cn(
                  "object-cover transition-transform duration-[6000ms] ease-out motion-reduce:transition-none",
                  i === index ? "scale-[1.04]" : "scale-100",
                )}
              />
            ) : (
              <span className="grid size-full place-items-center bg-ink p-6 text-center font-display text-2xl font-extrabold text-white">
                {banner.title}
              </span>
            );

            return (
              <div key={banner.id} className="relative h-full w-full shrink-0 overflow-hidden" aria-hidden={i !== index}>
                {banner.link ? (
                  <Link href={banner.link} aria-label={banner.title} tabIndex={i === index ? 0 : -1} className="block size-full">
                    {slide}
                  </Link>
                ) : (
                  slide
                )}
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Назад"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-lg transition hover:bg-brand group-hover:opacity-100 sm:grid"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Вперёд"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-lg transition hover:bg-brand group-hover:opacity-100 sm:grid"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="mt-3 flex justify-center gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Баннер ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className="relative h-1.5 w-8 overflow-hidden rounded-full bg-border"
              >
                {/* progress bar: fills during the auto-play interval */}
                <span
                  key={i === index ? `active-${index}-${paused}` : undefined}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-brand",
                    i === index ? (paused ? "w-full" : "w-full origin-left animate-[banner-progress_6s_linear]") : "w-0",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
