"use client";

import Image from "next/image";
import { useState } from "react";
import type { Image as ApiImage } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { ImageViewer } from "@/shared/ui/ImageViewer";

/** Photos under a post: a grid of previews; a click opens them full screen (arrows / keyboard to flip). */
export function NewsGallery({ images, title }: { images: ApiImage[]; title: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold">{t.news.gallery}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={fmt(t.news.openPhoto, { n: index + 1 })}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-surface-muted outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50"
            >
              <Image src={image.card} alt="" fill sizes="(max-width: 640px) 50vw, 256px" className="object-cover transition duration-300 group-hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <ImageViewer
          images={images.map((image, index) => ({ url: image.full, name: `${title} — ${index + 1}` }))}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}
