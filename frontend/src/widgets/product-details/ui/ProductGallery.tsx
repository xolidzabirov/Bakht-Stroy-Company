"use client";

import { useState } from "react";
import type { Image as ProductImage } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { SLIDE_MOVE, useSlideStrip } from "@/shared/lib/useSlider";
import { SlideArrows } from "@/shared/ui/SlideControls";

/**
 * Big photo with the same endless, soft move as the cards, and every photo as a small square under it:
 * the chosen one has the yellow frame. The big versions load when someone comes to the photo.
 */
export function ProductGallery({ images, name, badges }: { images: ProductImage[]; name: string; badges?: React.ReactNode }) {
  const { t } = useI18n();
  const { index, go, setIndex, stripStyle, slideStyle, swipe } = useSlideStrip(images.length);
  const [warm, setWarm] = useState(false);
  const many = images.length > 1;

  return (
    <div onPointerEnter={() => setWarm(true)} onFocus={() => setWarm(true)}>
      <div className="group/photo relative aspect-square touch-pan-y overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-muted" {...swipe}>
        {images.length > 0 ? (
          <div className={cn("absolute inset-0", SLIDE_MOVE)} style={stripStyle}>
            {images.map((image, i) => (
              <div key={image.id} className="absolute inset-0" style={slideStyle(i)}>
                {(i === 0 || warm) && (
                  // eslint-disable-next-line @next/next/no-img-element -- ready WebP sizes from the backend: a phone takes the smaller one
                  <img
                    src={image.full}
                    srcSet={`${image.card} 600w, ${image.full} 1600w`}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    alt={i === index ? name : ""}
                    draggable={false}
                    fetchPriority={i === 0 ? "high" : undefined}
                    decoding="async"
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">{t.product.noPhoto}</span>
        )}
        {badges && <div className="absolute left-4 right-4 top-4 z-10 flex flex-wrap items-center gap-2">{badges}</div>}
        {many && <SlideArrows onBack={() => go(-1)} onForward={() => go(1)} backLabel={t.common.back} forwardLabel={t.common.forward} />}
      </div>

      {many && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={fmt(t.product.photo, { n: i + 1 })}
              aria-current={i === index}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 transition duration-300",
                i === index ? "border-brand shadow-[0_0_0_3px] shadow-brand/25" : "border-border opacity-75 hover:border-foreground/30 hover:opacity-100",
              )}
            >
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- ready WebP size from the backend */}
                <img src={image.thumb} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
              </>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
