"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { SLIDE_MOVE, useSlider } from "@/shared/lib/useSlider";
import { SlideProgress } from "@/shared/ui";

const DURATION = 6000;
const SIDE = 1 / 3;

/**
 * Full-width carousel of admin banners (1920×600). Slides move sideways with a soft ease and never run out,
 * the picture zooms in slightly while it is shown; white bars over the picture show the time left.
 * Auto-play pauses on hover; swipe works on phones. A phone gets the banner's phone picture when there is one.
 * The first picture loads when the slider comes near; the neighbours a moment before their turn.
 *
 * Arrows appear dynamically on whichever side the cursor is closer to (left third -> left arrow, right third -> right arrow, center -> both).
 */
export function BannerSlider({ banners }: { banners: Banner[] }) {
  const { t } = useI18n();
  const count = banners.length;
  const { index, setIndex, go, paused, handlers, rootRef, stripStyle, slideStyle, shouldLoad } = useSlider(count);
  const [mouseSide, setMouseSide] = useState<"left" | "right" | "center" | null>(null);

  if (count === 0) return null;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const at = (e.clientX - rect.left) / rect.width;
    setMouseSide(at < SIDE ? "left" : at > 1 - SIDE ? "right" : "center");
  };

  const handlePointerLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouseSide(null);
    handlers.onMouseLeave();
  };

  const showLeft = count > 1 && (mouseSide === "left" || mouseSide === "center");
  const showRight = count > 1 && (mouseSide === "right" || mouseSide === "center");

  return (
    <div
      {...handlers}
      ref={rootRef}
      onPointerMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className="group relative aspect-[16/7] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted sm:aspect-[16/5]"
    >
      <div className={cn("absolute inset-0", SLIDE_MOVE)} style={stripStyle}>
        {banners.map((banner, i) => {
          const picture = banner.image ?? banner.image_mobile;
          const slide = picture ? (
            shouldLoad(i) && (
              <picture>
                {banner.image && banner.image_mobile && <source media="(max-width: 640px)" srcSet={banner.image_mobile} />}
                <img
                  src={picture}
                  alt={banner.title}
                  loading={i === 0 ? "lazy" : "eager"}
                  decoding="async"
                  className={cn(
                    "absolute inset-0 size-full object-cover transition-transform duration-[6000ms] ease-out motion-reduce:transition-none",
                    i === index ? "scale-[1.04]" : "scale-100",
                  )}
                />
              </picture>
            )
          ) : (
            <span className="grid size-full place-items-center bg-ink p-6 text-center font-display text-2xl font-extrabold text-white">
              {banner.title}
            </span>
          );

          return (
            <div key={banner.id} className="absolute inset-0 overflow-hidden" style={slideStyle(i)} aria-hidden={i !== index}>
              {banner.link ? (
                <Link prefetch={false} href={banner.link} aria-label={banner.title} tabIndex={i === index ? 0 : -1} className="block size-full">
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
            className={cn(
              "absolute left-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition-all duration-200 hover:bg-brand hover:scale-110 active:scale-95 sm:grid",
              showLeft ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none",
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label={t.common.forward}
            onClick={() => go(1)}
            className={cn(
              "absolute right-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition-all duration-200 hover:bg-brand hover:scale-110 active:scale-95 sm:grid",
              showRight ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none",
            )}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}
