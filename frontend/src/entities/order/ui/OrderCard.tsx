import Link from "next/link";
import { ChevronRight, Package, Store, Truck } from "lucide-react";
import type { OrderSummary } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt, plural } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatDate, formatMoney } from "@/shared/lib/format";
import { OrderStatusBadge, PaymentBadge } from "./OrderStatus";

/** One order in the list: number, date, statuses, sum — the whole card opens the order. */
export async function OrderCard({ order }: { order: OrderSummary }) {
  const { t, locale } = await getI18n();
  const Icon = order.delivery_type.value === "pickup" ? Store : Truck;

  return (
    <Link
      href={routes.accountOrder(order.number)}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-foreground/30 hover:shadow-lg hover:shadow-black/5 sm:p-5"
    >
      <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-muted sm:grid">
        <Package className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <b className="font-display text-lg">{order.number}</b>
          <OrderStatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{fmt(t.acc.orders.from, { date: formatDate(order.created_at, locale) })}</span>
          <span>
            {order.items_count} {plural(locale, order.items_count, t.common.products)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon className="size-3.5" />
            {order.delivery_type.label}
          </span>
        </span>
      </span>
      <span className="text-right">
        <b className="block font-display text-lg tabular-nums">{formatMoney(order.total, locale)}</b>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
