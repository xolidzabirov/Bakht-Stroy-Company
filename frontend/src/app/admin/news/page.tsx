import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Newspaper, Pin, Plus } from "lucide-react";
import { ResetFilters, SearchFilter, SelectFilter, TabFilter } from "@/features/admin-filters/ui/Filters";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminNews, Paginated } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { ButtonLink } from "@/shared/ui";
import { Pagination } from "@/shared/ui/Pagination";
import { EmptyState, PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.news.title };
}

type Search = Partial<Record<"status" | "type" | "search" | "page", string>>;

const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  published: "bg-success/10 text-success",
};

/** Every post, drafts and scheduled ones too: status tabs, section, search. */
export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaff(routes.adminNews);
  const search = await searchParams;
  const query = new URLSearchParams({ per_page: "20" });
  (["status", "type", "search", "page"] as const).forEach((key) => search[key] && query.set(key, search[key]!));

  const [{ t, locale }, news] = await Promise.all([getI18n(), userFetch<Paginated<AdminNews>>(`/admin/news?${query}`)]);
  const n = t.admin.news;
  const pageHref = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    next.delete("per_page");
    return `${routes.adminNews}?${next}`;
  };
  const addButton = (
    <ButtonLink href={routes.adminNewsNew}>
      <Plus className="size-4" />
      {n.add}
    </ButtonLink>
  );

  return (
    <div className="max-w-5xl">
      <PageHeader title={n.title} description={fmt(t.admin.common.total, { count: String(news.meta.total) })} actions={addButton} />

      <div className="mb-4 space-y-3">
        <TabFilter name="status" tabs={[{ value: null, label: t.admin.common.all }, ...Object.entries(n.statuses).map(([value, label]) => ({ value, label }))]} />
        <div className="flex flex-wrap gap-2">
          <SearchFilter placeholder={n.searchPlaceholder} />
          <SelectFilter name="type" label={n.type} options={Object.entries(n.types).map(([value, label]) => ({ value, label }))} />
          <ResetFilters />
        </div>
      </div>

      {news.data.length === 0 ? (
        <EmptyState icon={Newspaper} title={n.empty} action={addButton} />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {news.data.map((item) => (
              <li key={item.id}>
                <Link href={routes.adminNewsEdit(item.id)} className="flex items-center gap-4 p-3 transition hover:bg-muted/40 sm:p-4">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover.thumb} alt="" className="h-16 w-24 shrink-0 rounded-xl bg-muted object-cover" />
                  ) : (
                    <span className="grid h-16 w-24 shrink-0 place-items-center rounded-xl bg-muted">
                      <Newspaper className="size-5 text-muted-foreground" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={cn("rounded-full px-2 py-0.5 font-bold", statusTone[item.status] ?? "bg-muted")}>{n.statuses[item.status] ?? item.status}</span>
                      <span className="text-muted-foreground">{n.types[item.type.value] ?? item.type.label}</span>
                      {item.is_pinned && (
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <Pin className="size-3" />
                          {n.pinned}
                        </span>
                      )}
                    </span>
                    <b className="mt-1 line-clamp-2 leading-snug">{item.title}</b>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {item.published_at && <span>{formatDate(item.published_at, locale)}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" />
                        {fmt(n.views, { count: String(item.views_count) })}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={news.meta.current_page} lastPage={news.meta.last_page} href={pageHref} />
        </>
      )}
    </div>
  );
}
