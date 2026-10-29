import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone, Send } from "lucide-react";
import { getSettings } from "@/entities/settings/api/getSettings";
import { ContactForm } from "@/features/contact-form/ui/ContactForm";
import { env } from "@/shared/config/env";
import { routes, site } from "@/shared/config/site";
import { getI18n, setLocaleFrom } from "@/shared/i18n/server";
import { formatPhone } from "@/shared/lib/format";
import { mapLinks } from "@/shared/lib/maps";
import { Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";

const socialNames: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" };

/** Two Telegram accounts — told apart by the handle. */
const socialName = (key: string, url: string) => (key.startsWith("telegram") ? `Telegram @${url.split("/").pop()}` : (socialNames[key] ?? key));

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await setLocaleFrom(params);
  const { t } = await getI18n();

  return { title: t.meta.contacts, description: t.meta.contactsDescription, alternates: { canonical: routes.contacts } };
}

export default async function ContactsPage({ params }: Props) {
  await setLocaleFrom(params);
  const [settings, { t }] = await Promise.all([getSettings(), getI18n()]);
  const c = t.contacts;
  const maps = mapLinks(settings.address, settings.map);
  const socials = Object.entries(settings.socials ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1]));
  // WhatsApp and Telegram first: that is where customers write most.
  socials.sort(([a], [b]) => Number(!/whatsapp|telegram/.test(a)) - Number(!/whatsapp|telegram/.test(b)));

  // Structured data for Google: the store card with phones, address and the map point.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    name: settings.name || site.name,
    url: env.siteUrl,
    image: `${env.siteUrl}/icon.png`,
    telephone: settings.phones[0],
    email: settings.email ?? undefined,
    address: settings.address ? { "@type": "PostalAddress", streetAddress: settings.address, addressLocality: "Душанбе", addressCountry: "TJ" } : undefined,
    geo: settings.map?.lat != null && settings.map?.lng != null ? { "@type": "GeoCoordinates", latitude: settings.map.lat, longitude: settings.map.lng } : undefined,
    sameAs: socials.map(([, url]) => url),
  };

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, { label: c.title }]} />

      <header className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{c.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{c.lead}</p>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.15fr] [&>*]:min-w-0">
        <div className="grid content-start gap-4">
          <section className="rounded-[var(--radius-card)] bg-ink p-6 text-white sm:p-8">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
              <Phone className="size-4" />
              {c.phones}
            </h2>
            <ul className="mt-4 space-y-2">
              {settings.phones.map((phone) => (
                <li key={phone}>
                  <a href={`tel:${phone}`} className="font-display text-xl font-extrabold tracking-wide transition hover:text-brand sm:text-3xl">
                    {formatPhone(phone)}
                  </a>
                </li>
              ))}
            </ul>
            {socials.length > 0 && (
              <>
                <h2 className="mt-8 text-sm font-bold uppercase tracking-widest text-brand">{c.messengers}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socials.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold transition hover:bg-brand hover:text-on-brand"
                    >
                      {key === "whatsapp" ? <MessageCircle className="size-4" /> : key.startsWith("telegram") ? <Send className="size-4" /> : null}
                      {socialName(key, url)}
                    </a>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
            <ul className="space-y-5 text-sm">
              {settings.address && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{c.address}</p>
                    <p className="mt-1 text-base font-semibold">{settings.address}</p>
                    {maps && (
                      <a href={maps.route} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-semibold underline decoration-brand decoration-2 underline-offset-4">
                        <Navigation className="size-4" />
                        {c.route}
                      </a>
                    )}
                  </div>
                </li>
              )}
              {settings.work_hours && (
                <li className="flex gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{c.hours}</p>
                    <p className="mt-1 text-base font-semibold">{settings.work_hours}</p>
                  </div>
                </li>
              )}
              {settings.email && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{c.email}</p>
                    <a href={`mailto:${settings.email}`} className="mt-1 inline-block text-base font-semibold hover:text-muted-foreground">
                      {settings.email}
                    </a>
                  </div>
                </li>
              )}
            </ul>
          </section>
        </div>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold">{c.formTitle}</h2>
          <p className="mb-6 mt-2 text-sm text-muted-foreground">{c.formText}</p>
          <ContactForm />
        </section>
      </div>

      {maps && (
        <section className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-muted">
          <iframe src={maps.embed} title={c.mapTitle} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="block h-[360px] w-full sm:h-[440px]" />
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </Container>
  );
}
