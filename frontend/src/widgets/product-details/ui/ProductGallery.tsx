"use client";

import Image from "next/image";
import { useState } from "react";
import type { Image as ProductImage } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";

/**
 * Big photo and thumbnails under it.
 */
export function ProductGallery({ images, name, badges }: { images: ProductImage[]; name: string; badges?: React.ReactNode }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-muted">
        {current ? (
          <Image src={current.full} alt={name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-muted">{t.product.noPhoto}</span>
        )}
        {badges && <div className="absolute left-4 top-4 flex flex-col gap-2">{badges}</div>}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={fmt(t.product.photo, { n: index + 1 })}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 transition",
                index === active ? "border-brand" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={image.thumb} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
