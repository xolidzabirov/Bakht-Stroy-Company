import { ArrowRight, Phone, Truck } from "lucide-react";
import type { Banner } from "@/shared/api/types";
import { routes, site } from "@/shared/config/site";
import { formatPhone } from "@/shared/lib/format";
import { ButtonLink, Container, LogoMark } from "@/shared/ui";
import { BannerSlider } from "./BannerSlider";

const facts = [
  { value: "9", label: "направлений — от асфальта до техники" },
  { value: "10 м³", label: "миксеры для бетона" },
  { value: "1 день", label: "доставка по Душанбе" },
  { value: "152K", label: "подписчиков в Instagram" },
];

/**
 * First screen: brand message and key facts, then the admin banners carousel.
 */
export function Hero({ banners, phone }: { banners: Banner[]; phone?: string }) {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, #FFB800 0 2px, transparent 2px 28px)" }}
        />
        <Container className="relative grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.3fr_1fr] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <span className="size-1.5 rounded-full bg-brand" />
              Строительные материалы в Душанбе
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Всё для стройки — <span className="text-brand">в одном месте</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Асфальт и укладка дорог, цемент и бетон с доставкой миксерами, кирпич, арматура, окна и двери, сантехника, краски, бытовая техника и оборудование.
              Оптом и в розницу — со склада {site.shortName} на ул. Джабор Расулов.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={routes.catalog} size="lg">
                Перейти в каталог
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
              Доставка по Душанбе в день заказа · бетон своими миксерами 10 м³
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
              <LogoMark className="size-20" />
              <p className="mt-5 font-display text-2xl font-extrabold">Bakht Stroy Company</p>
              <p className="mt-1 text-sm text-white/60">{site.tagline}</p>
              <dl className="mt-8 grid grid-cols-2 gap-4">
                {facts.map((fact) => (
                  <div key={fact.label} className="rounded-2xl bg-white/5 p-4">
                    <dt className="font-display text-2xl font-extrabold text-brand">{fact.value}</dt>
                    <dd className="mt-1 text-xs text-white/60">{fact.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
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
