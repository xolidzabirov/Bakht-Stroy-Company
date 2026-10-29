"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { useSlider } from "@/shared/lib/useSlider";
import { SlideProgress } from "@/shared/ui";

const DURATION = 6000;

/**
 * Full-width carousel of admin banners (1920×600). Slides move sideways with a soft ease,
 * the picture zooms in slightly while it is shown; white bars over the picture show the time left.
 * Auto-play pauses on hover; swipe works on phones.
 */
export function BannerSlider({ banners }: { banners: Banner[] }) {
  const { t } = useI18n();
  const count = banners.length;
  const { index, setIndex, go, paused, handlers } = useSlider(count);

  if (count === 0) return null;

  return (
    <div {...handlers} className="group relative aspect-[16/7] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted sm:aspect-[16/5]">
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
              sizes="(max-width: 1280px) 100vw, 1760px"
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

      {count > 1 && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
          <SlideProgress
            count={count}
            index={index}
            duration={DURATION}
            paused={paused}
            onSelect={setIndex}
        onComplete={() => go(1)}
            className="absolute inset-x-6 bottom-3 mx-auto max-w-xl sm:bottom-5"
          />
          <button
            type="button"
            aria-label={t.common.back}
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-lg transition hover:bg-brand group-hover:opacity-100 sm:grid"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label={t.common.forward}
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-lg transition hover:bg-brand group-hover:opacity-100 sm:grid"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}
