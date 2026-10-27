import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, Heart, Package, ShoppingCart, Timer, Wallet } from "lucide-react";
import { OrderCard } from "@/entities/order/ui/OrderCard";
import { userFetch } from "@/shared/api/session";
import type { OrderSummary } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatMoney } from "@/shared/lib/format";
import { ButtonLink } from "@/shared/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.account, robots: { index: false } };
}

type Dashboard = {
  user: { name: string };
  orders: { total: number; active: number; completed: number; spent: number };
  last_order: OrderSummary | null;
  favorites_count: number;
  cart_items_count: number;
  unread_notifications_count: number;
};

/** Account overview: numbers, the latest order and quick links. */
export default async function AccountOverviewPage() {
  const [{ t, locale }, { data }] = await Promise.all([getI18n(), userFetch<{ data: Dashboard }>("/me/dashboard")]);
  const o = t.acc.overview;

  const stats = [
    { icon: Package, label: o.orders, value: String(data.orders.total) },
    { icon: Timer, label: o.active, value: String(data.orders.active) },
    { icon: CheckCircle2, label: o.completed, value: String(data.orders.completed) },
    { icon: Wallet, label: o.spent, value: formatMoney(data.orders.spent, locale) },
  ];

  const links = [
    { href: routes.favorites, icon: Heart, label: o.inFavorites, value: data.favorites_count },
    { href: routes.cart, icon: ShoppingCart, label: o.inCart, value: data.cart_items_count },
    { href: routes.accountNotifications, icon: Bell, label: o.unread, value: data.unread_notifications_count },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">{fmt(o.hello, { name: data.user.name.split(" ")[0] })}</h1>
        <p className="mt-1 text-muted-foreground">{o.lead}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-5">
            <Icon className="size-5 text-primary" />
            <dd className="mt-3 font-display text-2xl font-extrabold tabular-nums">{value}</dd>
            <dt className="text-sm text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{o.lastOrder}</h2>
          {data.last_order && (
            <Link href={routes.accountOrders} className="inline-flex items-center gap-1 text-sm font-semibold hover:underline">
              {o.allOrders}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        {data.last_order ? (
          <OrderCard order={data.last_order} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-bold">{o.noOrders}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{o.noOrdersText}</p>
            <ButtonLink href={routes.catalog} className="mt-4">
              {t.common.toCatalog}
            </ButtonLink>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {links.map(({ href, icon: Icon, label, value }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-foreground/30">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft">
              <Icon className="size-5" />
            </span>
            <span className="flex-1 text-sm text-muted-foreground">{label}</span>
            <b className="font-display text-xl">{value}</b>
          </Link>
        ))}
      </div>
    </div>
  );
}
