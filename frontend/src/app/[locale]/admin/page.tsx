import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, Clock, LayoutDashboard, Package, Users, Wallet } from "lucide-react";
import { TabFilter } from "@/features/admin-filters/ui/Filters";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminProduct, AdminStats } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatMoney } from "@/shared/lib/format";
import { EmptyState, PageHeader, Panel } from "@/widgets/admin-shell/ui/PageHeader";
import { ColumnChart } from "@/widgets/admin-dashboard/ui/ColumnChart";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.dashboard.title };
}

const PERIODS = ["7", "30", "90"] as const;

/** Numbers of the store: money, orders, customers, catalog; charts by day; what is running out. */
export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await requireStaff(routes.admin);
  const { period: requested } = await searchParams;
  const period = PERIODS.includes(requested as (typeof PERIODS)[number]) ? requested! : "30";

  const [{ t, locale }, { data: stats }, { data: lowStock }] = await Promise.all([
    getI18n(),
    userFetch<{ data: AdminStats }>(`/admin/stats?period=${period}`),
    userFetch<{ data: AdminProduct[] }>("/admin/products/low-stock"),
  ]);
  const d = t.admin.dashboard;
  const money = (value: number) => formatMoney(value, locale);
  const dayLabel = (iso: string) => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", { day: "2-digit", month: "2-digit" }).format(new Date(iso));
  const statusMax = Math.max(...stats.orders.by_status.map((s) => s.count), 1);

  // Each figure has its own tint, so the row reads at a glance; "awaiting" turns red while orders wait.
  const tiles = [
    { icon: Package, label: d.orders, value: String(stats.orders.in_period), hint: fmt(d.allTime, { amount: String(stats.orders.total) }), href: routes.adminOrders, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
    {
      icon: Clock,
      label: d.awaiting,
      value: String(stats.orders.awaiting),
      href: `${routes.adminOrders}?status=new`,
      accent: stats.orders.awaiting > 0,
      tint: stats.orders.awaiting > 0 ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    { icon: Wallet, label: d.averageCheck, value: money(stats.revenue.average_check), tint: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    { icon: Users, label: d.clients, value: String(stats.users.total), hint: fmt(d.today, { count: String(stats.users.new_today) }), href: routes.adminUsers, tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={LayoutDashboard} title={d.title} description={d.lead} actions={<TabFilter name="period" tabs={PERIODS.map((p) => ({ value: p === "30" ? null : p, label: t.admin.common.period[p] }))} />} />

      <div className="grid gap-3 lg:grid-cols-[1.3fr_2fr] [&>*]:min-w-0">
        {/* Hero figure: the one number the page leads with. */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-ink p-5 text-white shadow-lg shadow-black/10 sm:p-6">
          {/* A soft brand glow in the corner. */}
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand/25 blur-3xl" />
          <p className="relative flex items-center gap-2.5 text-sm font-semibold text-white/70">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-ink">
              <Wallet className="size-4" />
            </span>
            {d.revenue}
          </p>
          <p className="relative mt-5 font-display text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">{money(stats.revenue.completed_in_period)}</p>
          <div className="relative mt-5 flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 pt-4 text-sm text-white/70">
            <span>
              {d.ordersAmount}: <b className="text-white">{money(stats.revenue.orders_amount_in_period)}</b>
            </span>
            <span>{fmt(d.allTime, { amount: money(stats.revenue.completed_all_time) })}</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          {tiles.map(({ icon: Icon, label, value, hint, href, accent, tint }) => {
            const body = (
              <>
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">{label}</span>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tint}`}>
                    <Icon className="size-[18px]" />
                  </span>
                </span>
                <span className="mt-2 flex items-center gap-2">
                  <b className="font-display text-2xl font-extrabold tracking-tight tabular-nums sm:text-[28px]">{value}</b>
                  {accent && <span aria-hidden className="size-2 animate-pulse rounded-full bg-destructive" />}
                </span>
                {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
              </>
            );
            const box = "block rounded-2xl border bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition sm:p-5";
            return href ? (
              <Link key={label} href={href} className={`${box} ${accent ? "border-destructive/40" : "border-border"} hover:-translate-y-0.5 hover:shadow-md`}>
                {body}
              </Link>
            ) : (
              <div key={label} className={`${box} border-border`}>
                {body}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3 [&>*]:min-w-0">
        <Panel>
          <ColumnChart
            title={d.orderCount}
            points={stats.charts.map((day) => ({ label: dayLabel(day.date), value: day.orders }))}
            kind="count"
            locale={locale}
            tableLabels={{ date: t.admin.orders.date, value: d.orderCount, show: d.showTable }}
          />
        </Panel>
        <Panel>
          <ColumnChart
            title={d.amount}
            points={stats.charts.map((day) => ({ label: dayLabel(day.date), value: day.amount }))}
            kind="money"
            locale={locale}
            tableLabels={{ date: t.admin.orders.date, value: d.amount, show: d.showTable }}
          />
        </Panel>
        <Panel>
          <ColumnChart
            title={d.registrations}
            points={stats.charts.map((day) => ({ label: dayLabel(day.date), value: day.registrations }))}
            kind="count"
            locale={locale}
            tableLabels={{ date: t.admin.orders.date, value: d.registrations, show: d.showTable }}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title={d.byStatus}>
          <ul className="space-y-2.5">
            {stats.orders.by_status.map((status) => (
              <li key={status.value}>
                <Link href={`${routes.adminOrders}?status=${status.value}`} className="group grid grid-cols-[6.5rem_1fr_2.5rem] items-center sm:grid-cols-[8rem_1fr_2.5rem] gap-3 text-sm">
                  <span className="truncate font-medium group-hover:underline">{status.label}</span>
                  <span className="h-2.5 rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-chart-1" style={{ width: `${(status.count / statusMax) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{status.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={d.topProducts}>
          {stats.top_products.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{d.noTop}</p>
          ) : (
            <ol className="divide-y divide-border">
              {stats.top_products.map((product, index) => (
                <li key={`${product.product_id}-${product.name}`} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">{index + 1}</span>
                  {product.product_id ? (
                    <Link href={routes.adminProduct(product.product_id)} className="min-w-0 flex-1 truncate font-medium hover:underline">
                      {product.name}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate font-medium">{product.name}</span>
                  )}
                  <span className="shrink-0 text-muted-foreground">{fmt(d.sold, { quantity: String(product.quantity), amount: money(product.amount) })}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_2fr] [&>*]:min-w-0">
        <Panel title={d.catalog}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              [d.products, stats.catalog.products, routes.adminProducts],
              [d.activeProducts, stats.catalog.active_products, `${routes.adminProducts}?is_active=1`],
              [d.outOfStock, stats.catalog.out_of_stock, null],
              [d.lowStock, stats.catalog.low_stock, null],
              [d.categories, stats.catalog.categories, routes.adminCategories],
              [d.staff, stats.users.staff, null],
            ].map(([label, value, href]) => (
              <div key={String(label)} className="rounded-xl bg-muted p-3">
                <p className="text-xl font-extrabold">{value}</p>
                <p className="text-xs text-muted-foreground">{href ? <Link href={String(href)} className="hover:underline">{label}</Link> : label}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              {d.lowStockTitle}
            </span>
          }
          actions={
            <Link href={routes.adminProducts} className="inline-flex items-center gap-1 text-sm font-semibold hover:underline">
              {t.admin.nav.products}
              <ArrowRight className="size-4" />
            </Link>
          }
        >
          {lowStock.length === 0 ? (
            <EmptyState icon={Boxes} title={d.lowStockEmpty} />
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link href={routes.adminProduct(product.id)} className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/50">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image.thumb} alt="" className="size-10 shrink-0 rounded-lg bg-muted object-cover" />
                    ) : (
                      <span className="size-10 shrink-0 rounded-lg bg-muted" />
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">{product.name}</span>
                    <span className={product.stock === 0 ? "shrink-0 font-bold text-destructive" : "shrink-0 font-semibold text-muted-foreground"}>
                      {fmt(d.left, { count: `${product.stock} ${t.admin.product.units[product.unit.value] ?? product.unit.label}` })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
