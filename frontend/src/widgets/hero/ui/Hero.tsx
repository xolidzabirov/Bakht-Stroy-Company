import { ArrowRight, Phone, Truck } from "lucide-react";
import type { Banner } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { formatPhone } from "@/shared/lib/format";
import { ButtonLink, Container } from "@/shared/ui";
import { BannerSlider } from "./BannerSlider";
import { HeroPhotoSlider } from "./HeroPhotoSlider";

/** Photos in public/hero (see CREDITS.md there) — replace with the company's own shots. Captions come from the dictionary. */
// public/hero/<name>-720.webp and -1280.webp
const photos = ["/hero/mixer", "/hero/asphalt", "/hero/cement", "/hero/rebar"];

/**
 * First screen: brand message on the left, photo carousel on the right, key facts along the bottom;
 * then the admin banners carousel.
 */
export async function Hero({ banners, phone }: { banners: Banner[]; phone?: string }) {
  const { t } = await getI18n();
  const slides = t.hero.slides.map((slide, i) => ({ ...slide, src: photos[i % photos.length] }));

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--brand) 0 2px, transparent 2px 28px)" }}
        />
        <Container className="relative grid items-center gap-10 pt-10 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <span className="size-1.5 rounded-full bg-brand" />
              {t.hero.badge}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl xl:text-6xl">
              {t.hero.titleStart}
              <span className="text-brand">{t.hero.titleAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t.hero.text}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={routes.catalog} size="lg">
                {t.common.toCatalog}
                <ArrowRight className="size-5" />
              </ButtonLink>
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex h-13 items-center gap-2 rounded-xl border border-white/20 px-6 font-semibold text-white transition hover:border-brand hover:text-brand"
                >
                  <Phone className="size-5" />
                  {formatPhone(phone)}
                </a>
              )}
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-white/60">
              <Truck className="size-5 shrink-0 text-brand" />
              {t.hero.delivery}
            </div>
          </div>

          <HeroPhotoSlider slides={slides} />
        </Container>

        <Container className="relative">
          <dl className="mt-10 grid grid-cols-2 gap-x-6 border-t border-white/10 md:mt-14 md:grid-cols-4 md:gap-x-0">
            {t.hero.facts.map((fact) => (
              <div key={fact.label} className="py-6 md:border-l md:border-white/10 md:px-8 md:py-8 md:first:border-l-0 md:first:pl-0">
                <dt className="font-display text-3xl font-extrabold text-brand md:text-4xl">{fact.value}</dt>
                <dd className="mt-1 text-sm text-white/60">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {banners.length > 0 && (
        <Container className="mt-8">
          <BannerSlider banners={banners} />
        </Container>
      )}
    </>
  );
}
