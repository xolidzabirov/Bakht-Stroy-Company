import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getCategories } from "@/entities/category/api/getCategories";
import { getSettings } from "@/entities/settings/api/getSettings";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatPhone } from "@/shared/lib/format";
import { Container, Logo } from "@/shared/ui";

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  youtube: "YouTube",
};

/** Two Telegram accounts — tell them apart by the handle. */
const socialLabel = (key: string, url: string) =>
  key.startsWith("telegram")
    ? `Telegram @${url.split("/").pop()}`
    : (socialLabels[key] ?? key);

export async function Footer() {
  const [settings, categories, { t }] = await Promise.all([getSettings(), getCategories(), getI18n()]);
  const socials = Object.entries(settings.socials ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );

  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="h-1.5 bg-brand" />
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo inverted />
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {t.footer.description}
          </p>
          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {socials.map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-brand hover:text-brand"
                >
                  {socialLabel(key, url)}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand">
            {t.footer.catalog}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={routes.category(category.slug)}
                  className="hover:text-white"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand">
            {t.footer.buyers}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {[
              [routes.delivery, t.nav.delivery],
              [routes.news, t.nav.news],
              [routes.about, t.nav.about],
              [routes.contacts, t.nav.contacts],
              [routes.account, t.nav.account],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand">
            {t.footer.contacts}
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {settings.phones.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 font-semibold text-white hover:text-brand"
                >
                  <Phone className="size-4 text-brand" />
                  {formatPhone(phone)}
                </a>
              </li>
            ))}
            {settings.email && (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <Mail className="size-4 text-brand" />
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                {settings.address}
              </li>
            )}
            {settings.work_hours && (
              <li className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
                {settings.work_hours}
              </li>
            )}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{fmt(t.footer.rights, { year: new Date().getFullYear() })}</p>
          <p>{t.footer.slogan}</p>
        </Container>
      </div>
    </footer>
  );
}
