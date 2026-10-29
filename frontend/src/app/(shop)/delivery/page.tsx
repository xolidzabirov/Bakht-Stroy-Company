import type { Metadata } from "next";
import { Banknote, Building2, CalendarClock, Check, Clock, CreditCard, MapPin, Navigation, Store, Truck, Wallet } from "lucide-react";
import { getSettings } from "@/entities/settings/api/getSettings";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatMoney } from "@/shared/lib/format";
import { mapLinks } from "@/shared/lib/maps";
import { Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { ContactCta } from "@/widgets/contact-cta/ui/ContactCta";

const paymentIcons = { cash: Banknote, card_transfer: CreditCard, transfer: Building2 } as const;
const STATUS_FLOW = ["new", "confirmed", "assembling", "delivering", "completed"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return { title: t.meta.delivery, description: t.meta.deliveryDescription, alternates: { canonical: routes.delivery } };
}

export default async function DeliveryPage() {
  const [settings, { t, locale }] = await Promise.all([getSettings(), getI18n()]);
  const { delivery, payment } = settings;
  const pickupAddress = delivery?.pickup_address || settings.address;
  const maps = mapLinks(pickupAddress, settings.map);
  const money = (dirams: number) => formatMoney(dirams, locale);

  return (
    <>
      <Container className="py-8">
        <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, { label: t.delivery.title }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.delivery.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t.delivery.lead}</p>
        </header>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand text-on-brand">
                <Truck className="size-5" />
              </span>
              {t.delivery.deliveryTitle}
            </h2>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {delivery && delivery.price > 0 && (
                <div>
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="size-4" />
                    {t.delivery.price}
                  </dt>
                  <dd className="mt-1 text-xl font-extrabold">{fmt(t.delivery.priceFrom, { price: money(delivery.price) })}</dd>
                  {delivery.free_from > 0 && <dd className="mt-1 text-sm font-semibold text-success">{fmt(t.delivery.freeFrom, { sum: money(delivery.free_from) })}</dd>}
                </div>
              )}
              <div>
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="size-4" />
                  {t.delivery.terms}
                </dt>
                <dd className="mt-1 font-semibold">{t.delivery.termsText}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="size-4" />
                  {t.delivery.heavy}
                </dt>
                <dd className="mt-1 leading-relaxed">{t.delivery.heavyText}</dd>
              </div>
            </dl>
            {delivery?.note && <p className="mt-6 rounded-xl bg-brand-soft px-4 py-3 text-sm">{delivery.note}</p>}
          </section>

          <section className="flex flex-col rounded-[var(--radius-card)] bg-ink p-6 text-white sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand text-on-brand">
                <Store className="size-5" />
              </span>
              {t.delivery.pickupTitle}
            </h2>
            <p className="mt-4 text-white/75">{t.delivery.pickupText}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {pickupAddress && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-brand" />
                  {pickupAddress}
                </li>
              )}
              {settings.work_hours && (
                <li className="flex gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-brand" />
                  {settings.work_hours}
                </li>
              )}
            </ul>
            {maps && (
              <div className="mt-auto pt-6">
                <a
                  href={maps.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-on-brand transition hover:brightness-95"
                >
                  <Navigation className="size-4" />
                  {t.contacts.route}
                </a>
              </div>
            )}
          </section>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{t.delivery.paymentTitle}</h2>
          <p className="mt-2 text-muted-foreground">{t.delivery.paymentLead}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(Object.keys(paymentIcons) as (keyof typeof paymentIcons)[]).map((key) => {
              const Icon = paymentIcons[key];
              const method = t.checkout.payments[key];

              return (
                <div key={key} className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                  <span className="grid size-11 place-items-center rounded-2xl bg-surface-muted">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold">{method.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{method.text}</p>
                </div>
              );
            })}
          </div>
          {payment?.note && <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm">{payment.note}</p>}
        </section>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">{t.delivery.stepsTitle}</h2>
            <ol className="mt-6 space-y-5">
              {t.checkout.steps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand font-display font-extrabold text-on-brand">{index + 1}</span>
                  <p className="pt-1.5 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">{t.delivery.statusesTitle}</h2>
            <ol className="relative mt-6 space-y-5 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-0.5 before:bg-border">
              {STATUS_FLOW.map((status, index) => (
                <li key={status} className="relative flex gap-4">
                  <span
                    className={
                      index === STATUS_FLOW.length - 1
                        ? "grid size-9 shrink-0 place-items-center rounded-full bg-success text-white"
                        : "grid size-9 shrink-0 place-items-center rounded-full border-2 border-border bg-surface text-xs font-bold"
                    }
                  >
                    {index === STATUS_FLOW.length - 1 ? <Check className="size-4" /> : index + 1}
                  </span>
                  <div className="pt-1">
                    <p className="font-bold">{t.acc.order.steps[status]}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.delivery.statuses[status]}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-muted-foreground">{t.delivery.statusHint}</p>
          </section>
        </div>
      </Container>

      <ContactCta phone={settings.phones[0]} whatsapp={settings.socials?.whatsapp} telegram={settings.socials?.telegram} telegramChat={settings.socials?.telegram_chat} />
    </>
  );
}
