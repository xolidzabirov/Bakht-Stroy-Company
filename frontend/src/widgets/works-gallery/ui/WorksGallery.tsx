import type { Banner } from "@/shared/api/types";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { Marquee } from "@/shared/ui/Marquee";
import { SectionHeading } from "@/shared/ui/SectionHeading";

/** Few photos are repeated in the row: a row shorter than the screen would show a gap. */
const MIN_IN_ROW = 10;

/**
 * Photos of the company's work in an endless slow row, from Admin → Banners → «Фото работ».
 * The mouse over a photo stops the row. Without photos there is no section.
 */
export async function WorksGallery({ photos }: { photos: Banner[] }) {
  const shown = photos.filter((photo) => photo.image_work ?? photo.image);
  if (shown.length === 0) return null;

  const { t } = await getI18n();
  const count = Math.ceil(MIN_IN_ROW / shown.length) * shown.length;
  const row = Array.from({ length: count }, (_, i) => shown[i % shown.length]);

  return (
    <section className="mt-20 sm:mt-28">
      <Container>
        <SectionHeading title={t.home.worksTitle} subtitle={t.home.worksSubtitle} />
      </Container>
      <Marquee seconds={Math.max(60, row.length * 8)} className="[--marquee-gap:0.75rem] sm:[--marquee-gap:1.25rem]">
        {(copy) =>
          row.map((photo, i) => (
            <li key={`${photo.id}-${i}`} className="shrink-0">
              <figure className="group relative aspect-[3/2] w-64 overflow-hidden rounded-2xl bg-surface-muted sm:w-96">
                {/* eslint-disable-next-line @next/next/no-img-element -- a ready 900×600 WebP from the backend */}
                <img
                  src={photo.image_work ?? photo.image ?? undefined}
                  alt={copy || i >= shown.length ? "" : (photo.subtitle ?? photo.title)}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {photo.subtitle && (
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-sm font-semibold text-white opacity-0 transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                    {photo.subtitle}
                  </figcaption>
                )}
              </figure>
            </li>
          ))
        }
      </Marquee>
    </section>
  );
}
