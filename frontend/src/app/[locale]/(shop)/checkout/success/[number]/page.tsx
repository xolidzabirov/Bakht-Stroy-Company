import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banknote, Building2, CheckCircle2, CreditCard, MessageCircle, Send } from "lucide-react";
import { getSettings } from "@/entities/settings/api/getSettings";
import { ApiError, apiFetch } from "@/shared/api/http";
import { requireUser } from "@/shared/api/requireUser";
import { getToken } from "@/shared/api/session";
import type { Order } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatMoney } from "@/shared/lib/format";
import { Badge, ButtonLink, Container } from "@/shared/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.orderPlaced, robots: { index: false } };
}

type Props = { params: Promise<{ number: string }> };

/**
 * "Order placed": the number, what happens next and how to pay — the payment is taken before delivery.
 */
export default async function OrderPlacedPage({ params }: Props) {
  const { number } = await params;
  await requireUser(routes.orderPlaced(number));
  const [{ t, locale }, token, settings] = await Promise.all([getI18n(), getToken(), getSettings()]);

  let order: Order;
  try {
    order = (await apiFetch<{ data: Order }>(`/orders/${encodeURIComponent(number)}`, { token, cache: "no-store" })).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const money = (value: number) => formatMoney(value, locale);
  const method = order.payment_method.value;
  const receipt = encodeURIComponent(fmt(t.success.receiptText, { number: order.number }));
  const whatsapp = settings.socials?.whatsapp;
  const telegram = settings.socials?.telegram_chat ?? settings.socials?.telegram;
  const card = settings.payment?.card_number;

  return (
    <Container className="max-w-3xl py-10 lg:w-full lg:max-w-3xl">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-16 text-success" />
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{t.success.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t.success.lead}</p>
      </div>

      <dl className="mt-8 grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">{t.success.number}</dt>
          <dd className="font-display text-2xl font-extrabold">{order.number}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t.success.total}</dt>
          <dd className="font-display text-2xl font-extrabold">{money(order.total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t.success.status}</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="dark">{order.status.label}</Badge>
            <Badge tone="muted">{order.payment_status.label}</Badge>
          </dd>
        </div>
      </dl>

      <section className="mt-5 rounded-[var(--radius-card)] border-2 border-primary/50 bg-brand-soft p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          {method === "cash" ? <Banknote className="size-5" /> : method === "card_transfer" ? <CreditCard className="size-5" /> : <Building2 className="size-5" />}
          {t.success.paymentTitle}: {order.payment_method.label}
        </h2>

        {method === "cash" && (
          <p className="mt-2">{fmt(t.success.cashText, { address: settings.address ?? "Душанбе, ул. Джабор Расулов", hours: settings.work_hours ?? "" })}</p>
        )}

        {method === "card_transfer" && (
          <>
            <p className="mt-2">{fmt(t.success.cardText, { sum: money(order.total) })}</p>
            {card ? (
              <dl className="mt-4 grid gap-3 rounded-2xl bg-surface p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">{t.success.cardNumber}</dt>
                  <dd className="font-display text-xl font-extrabold tracking-wider">{card}</dd>
                </div>
                {settings.payment?.card_holder && (
                  <div>
                    <dt className="text-xs text-muted-foreground">{t.success.cardHolder}</dt>
                    <dd className="font-semibold">
                      {settings.payment.card_holder}
                      {settings.payment.bank ? ` · ${settings.payment.bank}` : ""}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t.success.cardLater}</p>
            )}
          </>
        )}

        {method === "transfer" && <p className="mt-2">{t.success.transferText}</p>}

        <p className="mt-3 text-sm text-muted-foreground">{t.success.afterPay}</p>

        {method !== "cash" && (whatsapp || telegram) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {whatsapp && (
              <a href={`${whatsapp}?text=${receipt}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white">
                <MessageCircle className="size-4" />
                {t.success.sendReceipt} · WhatsApp
              </a>
            )}
            {telegram && (
              <a href={telegram} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#229ED9] px-5 text-sm font-semibold text-white">
                <Send className="size-4" />
                {t.success.sendReceipt} · Telegram
              </a>
            )}
          </div>
        )}
      </section>

      <ol className="mt-5 grid gap-3 sm:grid-cols-4">
        {t.checkout.steps.map((step, index) => (
          <li key={step} className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
            <p className="mt-2 text-muted-foreground">{step}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={routes.catalog}>{t.success.toCatalog}</ButtonLink>
        <ButtonLink href={routes.account} variant="outline">
          {t.success.myOrders}
        </ButtonLink>
      </div>
    </Container>
  );
}
