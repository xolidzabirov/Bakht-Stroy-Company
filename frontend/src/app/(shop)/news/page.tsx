import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getNews, getNewsTypes } from "@/entities/news/api/getNews";
import { NewsCard } from "@/entities/news/ui/NewsCard";
import { routes } from "@/shared/config/site";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { Pagination } from "@/shared/ui/Pagination";

type SearchParams = { type?: string; page?: string };
type Props = { searchParams: Promise<SearchParams> };

const PER_PAGE = 9;

/** Only the known types reach the API; anything else shows all posts. */
function pickType(value: string | undefined, t: Dictionary): string | undefined {
  return value && value in t.news.types ? value : undefined;
}

function newsHref(type: string | undefined, page = 1): string {
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  if (page > 1) query.set("page", String(page));

  return query.size ? `${routes.news}?${query}` : routes.news;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [params, { t }] = await Promise.all([searchParams, getI18n()]);
  const type = pickType(params.type, t);

  return {
    title: type ? `${t.news.types[type]} — ${t.meta.news}` : t.meta.news,
    description: t.meta.newsDescription,
    alternates: { canonical: newsHref(type) },
  };
}

export default async function NewsPage({ searchParams }: Props) {
  const [params, { t }] = await Promise.all([searchParams, getI18n()]);
  const type = pickType(params.type, t);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const [news, types] = await Promise.all([getNews({ type, page, per_page: PER_PAGE }), getNewsTypes()]);

  const items = news?.data ?? [];
  const total = types.reduce((sum, item) => sum + item.count, 0);
  const tabs = [
    { value: undefined, label: t.news.all, count: total },
    ...types.filter((item) => item.count > 0).map((item) => ({ value: item.value, label: t.news.types[item.value] ?? item.label, count: item.count })),
  ];

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, { label: t.news.title }]} />

      <header className="mt-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t.news.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.news.subtitle}</p>
      </header>

      {tabs.length > 2 && (
        <nav aria-label={t.news.title} className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {tabs.map((tab) => {
            const active = tab.value === type;

            return (
              <Link
                key={tab.value ?? "all"}
                href={newsHref(tab.value)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
                  active ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink" : "border-border hover:border-foreground/40",
                )}
              >
                {tab.label}
                <span className={cn("text-xs", active ? "opacity-70" : "text-muted-foreground")}>{tab.count}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {items.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-[var(--radius-card)] border border-dashed border-border px-6 py-16 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-ink text-brand">
            <Newspaper className="size-7" />
          </span>
          <h2 className="mt-5 text-xl font-extrabold">{t.news.empty}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{t.news.emptyText}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}

      {news && <Pagination page={news.meta.current_page} lastPage={news.meta.last_page} href={(value) => newsHref(type, value)} />}
    </Container>
  );
}
