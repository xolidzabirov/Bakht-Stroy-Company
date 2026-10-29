import type { Metadata } from "next";
import { Clock, Construction, Factory, MapPin, Phone, Truck } from "lucide-react";
import { getCategories } from "@/entities/category/api/getCategories";
import { getProducts } from "@/entities/product/api/getProducts";
import { getSettings } from "@/entities/settings/api/getSettings";
import { routes, site } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { formatPhone } from "@/shared/lib/format";
import { ButtonLink, Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { SectionHeading } from "@/shared/ui/SectionHeading";
import { Advantages } from "@/widgets/advantages/ui/Advantages";
import { CategoryGrid } from "@/widgets/category-grid/ui/CategoryGrid";
import { ContactCta } from "@/widgets/contact-cta/ui/ContactCta";

const serviceIcons = [Truck, Construction, Factory];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return { title: t.meta.about, description: t.meta.aboutDescription, alternates: { canonical: routes.about } };
}

export default async function AboutPage() {
  const [categories, products, settings, { t }] = await Promise.all([getCategories(), getProducts({ per_page: 1 }), getSettings(), getI18n()]);
  const productsTotal = products?.meta.total ?? 0;

  // Only numbers we can stand behind: the live catalog plus the delivery facts the company states everywhere.
  const facts = [
    ...(categories.length > 0 ? [{ value: String(categories.length), label: t.about.factCategories }] : []),
    ...(productsTotal > 0 ? [{ value: String(productsTotal), label: t.about.factProducts }] : []),
    ...t.about.facts,
  ];

  return (
    <>
      <Container className="py-8">
        <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, { label: t.about.title }]} />

        <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-12 sm:py-14">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full border-[32px] border-brand opacity-20" />
          <div className="relative max-w-3xl">
            <p lang="tg" className="text-sm font-semibold uppercase tracking-widest text-brand">{site.tagline}</p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">{t.about.title}</h1>
            <p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">{t.about.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={routes.catalog} size="lg">
                {t.common.toCatalog}
              </ButtonLink>
              <ButtonLink href={routes.contacts} size="lg" variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                {t.about.toContacts}
              </ButtonLink>
            </div>
          </div>
        </section>

        {facts.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {facts.map((fact) => (
              <li key={fact.label} className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <p className="font-display text-3xl font-extrabold sm:text-4xl">{fact.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{fact.label}</p>
              </li>
            ))}
          </ul>
        )}
      </Container>

      <CategoryGrid categories={categories} />

      <Container className="mt-16">
        <SectionHeading title={t.about.servicesTitle} subtitle={t.about.servicesSubtitle} />
        <div className="grid gap-4 md:grid-cols-3">
          {t.about.services.map((service, index) => {
            const Icon = serviceIcons[index] ?? Truck;

            return (
              <div key={service.title} className="rounded-[var(--radius-card)] bg-surface-muted p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.text}</p>
              </div>
            );
          })}
        </div>
      </Container>

      <Advantages title={t.about.whyTitle} />

      <Container className="mt-16">
        <div className="grid gap-6 rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">{t.about.visitTitle}</h2>
            <p className="mt-2 text-muted-foreground">{t.about.visitText}</p>
          </div>
          <ul className="space-y-3 text-sm">
            {settings.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand" />
                {settings.address}
              </li>
            )}
            {settings.work_hours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-brand" />
                {settings.work_hours}
              </li>
            )}
            {settings.phones[0] && (
              <li>
                <a href={`tel:${settings.phones[0]}`} className="inline-flex gap-3 font-semibold hover:text-muted-foreground">
                  <Phone className="size-5 shrink-0 text-brand" />
                  {formatPhone(settings.phones[0])}
                </a>
              </li>
            )}
            <li className="pt-1">
              <ButtonLink href={routes.contacts} variant="dark">
                {t.about.toContacts}
              </ButtonLink>
            </li>
          </ul>
        </div>
      </Container>

      <ContactCta phone={settings.phones[0]} whatsapp={settings.socials?.whatsapp} telegram={settings.socials?.telegram} telegramChat={settings.socials?.telegram_chat} />
    </>
  );
}
