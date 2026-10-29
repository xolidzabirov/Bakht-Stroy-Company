import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Phone } from "lucide-react";
import { OrderStatusBadge, PaymentBadge } from "@/entities/order/ui/OrderStatus";
import { DateFilter, ResetFilters, SearchFilter, SelectFilter, TabFilter } from "@/features/admin-filters/ui/Filters";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminOrder, Paginated } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatMoney, formatPhone } from "@/shared/lib/format";
import { Pagination } from "@/shared/ui/Pagination";
import { EmptyState, PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.orders.title };
}

type Search = Partial<Record<"status" | "payment_status" | "delivery_type" | "date_from" | "date_to" | "search" | "page", string>>;
const KEYS = ["status", "payment_status", "delivery_type", "date_from", "date_to", "search", "page"] as const;

/** All orders: status tabs, payment / delivery / dates / search filters, newest first. */
export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaff(routes.adminOrders);
  const search = await searchParams;
  const query = new URLSearchParams();
  KEYS.forEach((key) => search[key] && query.set(key, search[key]!));

  const [{ t, locale }, orders] = await Promise.all([getI18n(), userFetch<Paginated<AdminOrder>>(`/admin/orders?per_page=20&${query}`)]);
  const o = t.admin.orders;
  const dateTime = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  const pageHref = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    return `${routes.adminOrders}?${next}`;
  };

  return (
    <div>
      <PageHeader title={o.title} description={fmt(t.admin.common.total, { count: String(orders.meta.total) })} />

      <div className="mb-4 space-y-3">
        <TabFilter name="status" tabs={[{ value: null, label: t.admin.common.all }, ...Object.entries(o.statuses).map(([value, label]) => ({ value, label }))]} />
        <div className="flex flex-wrap gap-2">
          <SearchFilter placeholder={o.searchPlaceholder} />
          <SelectFilter name="payment_status" label={o.payment} options={Object.entries(o.payments).map(([value, label]) => ({ value, label }))} />
          <SelectFilter name="delivery_type" label={o.delivery} options={Object.entries(o.deliveries).map(([value, label]) => ({ value, label }))} />
          <DateFilter name="date_from" label={o.from} />
          <DateFilter name="date_to" label={o.to} />
          <ResetFilters />
        </div>
      </div>

      {orders.data.length === 0 ? (
        <EmptyState icon={PackageSearch} title={t.admin.common.empty} text={t.admin.common.emptyText} />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">{o.number}</th>
                  <th className="px-4 py-3 font-semibold">{o.customer}</th>
                  <th className="px-4 py-3 font-semibold">{o.status}</th>
                  <th className="px-4 py-3 font-semibold">{o.payment}</th>
                  <th className="px-4 py-3 font-semibold">{o.delivery}</th>
                  <th className="px-4 py-3 text-right font-semibold">{o.sum}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.data.map((order) => (
                  <tr key={order.id} className="relative transition hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={routes.adminOrder(order.number)} className="font-bold after:absolute after:inset-0 hover:underline">
                        {order.number}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{dateTime.format(new Date(order.created_at))}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium">{order.customer.name}</span>
                      <span className="block text-xs text-muted-foreground">{formatPhone(order.customer.phone)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={order.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.deliveries[order.delivery_type.value] ?? order.delivery_type.label}</td>
                    <td className="px-4 py-3 text-right">
                      <b className="tabular-nums">{formatMoney(order.total, locale)}</b>
                      {order.items_count !== undefined && <span className="block text-xs text-muted-foreground">{fmt(o.items, { count: String(order.items_count) })}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: cards */}
          <ul className="space-y-2 md:hidden">
            {orders.data.map((order) => (
              <li key={order.id}>
                <Link href={routes.adminOrder(order.number)} className="block rounded-2xl border border-border bg-surface p-4 transition active:bg-muted">
                  <span className="flex items-center justify-between gap-2">
                    <b>{order.number}</b>
                    <b className="tabular-nums">{formatMoney(order.total, locale)}</b>
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    {order.customer.name} · <Phone className="size-3.5" /> {formatPhone(order.customer.phone)}
                  </span>
                  <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <OrderStatusBadge status={order.status} />
                    <PaymentBadge status={order.payment_status} />
                    <span className="ml-auto text-xs text-muted-foreground">{dateTime.format(new Date(order.created_at))}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination page={orders.meta.current_page} lastPage={orders.meta.last_page} href={pageHref} />
        </>
      )}
    </div>
  );
}
