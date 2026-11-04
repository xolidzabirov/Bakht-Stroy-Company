"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { SLIDE_MOVE, useSlideStrip } from "@/shared/lib/useSlider";
import { SlideArrows, SlideDots } from "@/shared/ui/SlideControls";

type Props = { images: { id: number; thumb: string; card: string }[]; href: string; name: string; priority: boolean };

/**
 * The photos of a product on its card: endless, like the sliders of the home page. Arrows on hover, a swipe on a phone.
 * The other photos load only when someone comes to the card: a long list stays light.
 */
export function CardGallery({ images, href, name, priority }: Props) {
  const { t } = useI18n();
  const { index, go, setIndex, stripStyle, slideStyle, swipe } = useSlideStrip(images.length);
  const [warm, setWarm] = useState(false);

  return (
    <div className="group/photo absolute inset-0 z-[1] touch-pan-y" onPointerEnter={() => setWarm(true)} onFocus={() => setWarm(true)} {...swipe}>
      <Link prefetch={false} href={href} tabIndex={-1} aria-hidden draggable={false} className="absolute inset-0 block overflow-hidden">
        <div className={cn("absolute inset-0", SLIDE_MOVE)} style={stripStyle}>
          {images.map((image, i) => (
            <div key={image.id} className="absolute inset-0 overflow-hidden" style={slideStyle(i)}>
              {(i === 0 || warm) && (
                // eslint-disable-next-line @next/next/no-img-element -- ready WebP sizes from the backend
                <img
                  src={image.card}
                  srcSet={`${image.thumb} 300w, ${image.card} 600w`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  alt={i === 0 ? name : ""}
                  draggable={false}
                  loading={i === 0 && !priority ? "lazy" : "eager"}
                  fetchPriority={i === 0 && priority ? "high" : undefined}
                  decoding="async"
                  className="absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
                />
              )}
            </div>
          ))}
        </div>
      </Link>
      <SlideArrows onBack={() => go(-1)} onForward={() => go(1)} backLabel={t.common.back} forwardLabel={t.common.forward} />
      <SlideDots count={images.length} index={index} onSelect={setIndex} label={(n) => fmt(t.product.photo, { n })} />
    </div>
  );
}
