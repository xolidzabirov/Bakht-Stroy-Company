import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, MapPin, MessageSquareText, Store, UserRound } from "lucide-react";
import { OrderProgress, OrderStatusBadge, PaymentBadge } from "@/entities/order/ui/OrderStatus";
import { OrderActions } from "@/features/order-actions/ui/OrderActions";
import { ApiError } from "@/shared/api/http";
import { userFetch } from "@/shared/api/session";
import type { Order, OrderHistoryEntry } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatDate, formatMoney, formatPhone } from "@/shared/lib/format";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ number }, { t }] = await Promise.all([params, getI18n()]);

  return { title: fmt(t.acc.order.title, { number }), robots: { index: false } };
}

const timeFormat = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });

/** One order: progress, payment, items, receiving, history and actions. */
export default async function AccountOrderPage({ params }: Props) {
  const { number } = await params;
  const { t, locale } = await getI18n();

  let order: Order & { history: OrderHistoryEntry[] };
  try {
    order = (await userFetch<{ data: Order & { history: OrderHistoryEntry[] } }>(`/orders/${encodeURIComponent(number)}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const money = (value: number) => formatMoney(value, locale);
  const o = t.acc.order;
  const waitingForPayment = order.payment_status.value !== "paid" && !["cancelled", "completed"].includes(order.status.value);

  return (
    <div className="space-y-5">
      <Link href={routes.accountOrders} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {o.back}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{fmt(o.title, { number: order.number })}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {fmt(t.acc.orders.from, { date: formatDate(order.created_at, locale) })}
            <OrderStatusBadge status={order.status} />
            <PaymentBadge status={order.payment_status} />
          </p>
        </div>
        <OrderActions number={order.number} canCancel={order.can_cancel} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-5 font-extrabold">{o.progress}</h2>
        <OrderProgress status={order.status} />
      </section>

      {waitingForPayment && (
        <p className="flex gap-3 rounded-2xl border-2 border-primary/50 bg-brand-soft p-4 text-sm">
          <Banknote className="size-5 shrink-0" />
          <span>
            <b className="block">
              {o.payment}: {order.payment_method.label}
            </b>
            {o.payHint}
          </span>
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface">
          <h2 className="border-b border-border px-5 py-4 font-extrabold">{o.items}</h2>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  {item.product_slug ? (
                    <Link href={routes.product(item.product_slug)} className="line-clamp-2 font-semibold hover:underline">
                      {item.name}
                    </Link>
                  ) : (
                    <span className="line-clamp-2 font-semibold">{item.name}</span>
                  )}
                  <span className="text-muted-foreground">
                    {item.quantity} {item.unit.label} × {money(item.price)}
                  </span>
                </span>
                <b className="tabular-nums">{money(item.total)}</b>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-border px-5 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{o.subtotal}</dt>
              <dd className="font-semibold">{money(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{o.deliveryPrice}</dt>
              <dd className="font-semibold">{order.delivery_price ? money(order.delivery_price) : o.free}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <dt className="font-semibold">{o.total}</dt>
              <dd className="font-display text-2xl font-extrabold">{money(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 text-sm">
            <div className="flex gap-3">
              {order.delivery_type.value === "pickup" ? <Store className="size-5 shrink-0 text-primary" /> : <MapPin className="size-5 shrink-0 text-primary" />}
              <span>
                <b className="block">{o.receiving}</b>
                {order.delivery_type.value === "pickup"
                  ? o.pickup
                  : [order.address?.city, order.address?.street, order.address?.house].filter(Boolean).join(", ")}
              </span>
            </div>
            <div className="flex gap-3">
              <UserRound className="size-5 shrink-0 text-primary" />
              <span>
                <b className="block">{o.recipient}</b>
                {order.customer.name} · {formatPhone(order.customer.phone)}
              </span>
            </div>
            {order.comment && (
              <div className="flex gap-3">
                <MessageSquareText className="size-5 shrink-0 text-primary" />
                <span>
                  <b className="block">{o.comment}</b>
                  {order.comment}
                </span>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-extrabold">{o.history}</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-border pl-5">
              {[...order.history].reverse().map((entry, index) => (
                <li key={`${entry.created_at}-${index}`} className="relative text-sm">
                  <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-surface bg-primary" />
                  <b>{entry.status.label}</b>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDate(entry.created_at, locale)}, {timeFormat.format(new Date(entry.created_at))}
                  </span>
                  {entry.comment && <p className="mt-0.5 text-muted-foreground">{entry.comment}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
