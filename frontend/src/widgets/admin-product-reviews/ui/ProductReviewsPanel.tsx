import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { DeleteReview } from "@/features/admin-products/ui/DeleteReview";
import { TabFilter } from "@/features/admin-filters/ui/Filters";
import { userFetch } from "@/shared/api/session";
import type { AdminReviewsPage } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt, plural } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPhone } from "@/shared/lib/format";
import { Panel } from "@/shared/ui/admin/PageHeader";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { Pagination } from "@/shared/ui/Pagination";
import { range, SkeletonText } from "@/shared/ui/PageSkeletons";
import { Stars } from "@/shared/ui/Stars";

const NEGATIVE_UP_TO = 2;

type Filter = "negative" | "positive" | null;

/**
 * What customers say about a product, on its page in the admin panel: how many reviews, the average, every review
 * with its author, and a delete button. The negative ones are one tab away and marked in red.
 */
export async function ProductReviewsPanel({ productId, filter, page }: { productId: number; filter: Filter; page: number }) {
  const { t, locale } = await getI18n();
  const r = t.admin.product.reviews;
  const words = t.product.reviews;
  const query = new URLSearchParams({ page: String(page), ...(filter ? { filter } : {}) });
  const { data: reviews, meta, summary } = await userFetch<AdminReviewsPage>(`/admin/products/${productId}/reviews?${query}`);

  const negative = range(NEGATIVE_UP_TO).reduce((sum, i) => sum + (summary.stars[String(i + 1)] ?? 0), 0);
  const href = (next: number) => {
    const params = new URLSearchParams({ ...(filter ? { reviews: filter } : {}), ...(next > 1 ? { page: String(next) } : {}) });
    const search = params.toString();

    return `${routes.adminProduct(productId)}${search ? `?${search}` : ""}#reviews`;
  };

  return (
    <div id="reviews" className="mt-4 scroll-mt-24">
      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            <MessageSquareText className="size-4" />
            {r.title}
          </span>
        }
        actions={
          summary.count > 0 ? (
            <span className="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-sm">
              <Stars value={summary.average ?? 0} label={fmt(words.outOfFive, { value: summary.average ?? 0 })} />
              <b className="tabular-nums">{summary.average?.toFixed(1)}</b>
              <span className="text-muted-foreground">
                {summary.count} {plural(locale, summary.count, words.count)}
              </span>
            </span>
          ) : undefined
        }
      >
        {summary.count === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{r.empty}</p>
        ) : (
          <>
            <TabFilter
              name="reviews"
              tabs={[
                { value: null, label: r.all, count: summary.count },
                { value: "negative", label: r.negative, count: negative },
                { value: "positive", label: r.positive, count: summary.count - negative },
              ]}
            />
            {reviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{r.emptyFiltered}</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {reviews.map((review) => {
                  const bad = review.rating <= NEGATIVE_UP_TO;

                  return (
                    <li key={review.id} className="flex items-start gap-3 py-4 last:pb-0">
                      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display font-extrabold text-brand">
                        {(review.author.name ?? "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          {review.author.deleted ? (
                            <b className="text-sm text-muted-foreground">{r.deletedAccount}</b>
                          ) : (
                            <Link href={routes.adminUser(review.author.id)} className="text-sm font-bold hover:underline">
                              {review.author.name}
                            </Link>
                          )}
                          <Stars value={review.rating} size="xs" label={fmt(words.outOfFive, { value: review.rating })} />
                          {bad && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">{r.negativeMark}</span>}
                        </p>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          <time dateTime={review.created_at}>{formatDate(review.created_at, locale)}</time>
                          {!review.author.deleted && review.author.phone && <span className="tabular-nums">{formatPhone(review.author.phone)}</span>}
                          {!review.author.deleted && review.author.email && <span className="break-all">{review.author.email}</span>}
                        </p>
                        <p className={cn("mt-2 whitespace-pre-line break-words text-sm leading-relaxed")}>{review.body}</p>
                      </div>
                      <DeleteReview reviewId={review.id} />
                    </li>
                  );
                })}
              </ul>
            )}
            <Pagination page={meta.current_page} lastPage={meta.last_page} href={href} />
          </>
        )}
      </Panel>
    </div>
  );
}

/** While the reviews of the panel above load: the form of the product is already there. */
export function ProductReviewsPanelSkeleton() {
  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]" aria-busy>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <SkeletonText className="min-w-0 flex-1 font-display text-[15px] font-bold" w="w-40" />
        <SkeletonText className="text-sm" w="w-44" />
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5 pb-1">
          {["w-20", "w-32", "w-32"].map((width, i) => (
            <Skeleton key={i} className={cn("h-[34px] rounded-full", width)} />
          ))}
        </div>
        <div className="mt-2 divide-y divide-border">
          {range(3).map((i) => (
            <div key={i} className="flex items-start gap-3 py-4 last:pb-0">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonText className="text-sm font-bold" w="w-44" />
                <SkeletonText className="mt-0.5 text-xs" w="w-56 max-w-full" />
                <SkeletonText className="mt-2 text-sm leading-relaxed" lines={["w-full", "w-2/3"]} />
              </div>
              <Skeleton className="size-9 shrink-0 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
