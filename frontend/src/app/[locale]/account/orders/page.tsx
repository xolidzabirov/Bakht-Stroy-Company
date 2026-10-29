import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { OrderCard } from "@/entities/order/ui/OrderCard";
import { userFetch } from "@/shared/api/session";
import type { OrderSummary, Paginated } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { ButtonLink } from "@/shared/ui";
import { Pagination } from "@/shared/ui/Pagination";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.acc.orders.title, robots: { index: false } };
}

const FILTERS = ["all", "active", "completed", "cancelled"] as const;

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

/** All orders of the user with status tabs and pages. */
export default async function AccountOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = FILTERS.includes(params.status as (typeof FILTERS)[number]) ? (params.status as (typeof FILTERS)[number]) : "all";
  const page = Math.max(1, Number(params.page) || 1);

  const query = new URLSearchParams({ per_page: "10", page: String(page), ...(filter !== "all" ? { status: filter } : {}) });
  const [{ t }, result] = await Promise.all([getI18n(), userFetch<Paginated<OrderSummary>>(`/orders?${query}`)]);

  const href = (status: string, pageNumber = 1) => {
    const next = new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(pageNumber > 1 ? { page: String(pageNumber) } : {}) }).toString();

    return next ? `${routes.accountOrders}?${next}` : routes.accountOrders;
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{t.acc.orders.title}</h1>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={href(value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
              value === filter ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink" : "border-border bg-surface hover:border-foreground/30",
            )}
          >
            {t.acc.orders.filters[value]}
          </Link>
        ))}
      </div>

      {result.data.length > 0 ? (
        <div className="mt-5 space-y-3">
          {result.data.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          <Pagination page={result.meta.current_page} lastPage={result.meta.last_page} href={(value) => href(filter, value)} />
        </div>
      ) : (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="mt-4 font-bold">{t.acc.orders.empty}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.acc.orders.emptyText}</p>
          <ButtonLink href={routes.catalog} className="mt-5">
            {t.common.toCatalog}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
