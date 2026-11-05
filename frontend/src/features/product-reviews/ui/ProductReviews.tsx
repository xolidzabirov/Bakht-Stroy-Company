"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, MessageSquarePlus, Pencil, Star } from "lucide-react";
import { bff } from "@/shared/api/client";
import type { Review, ReviewsPage } from "@/shared/api/types";
import { useMe } from "@/shared/api/useMe";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt, plural } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Button, buttonClasses } from "@/shared/ui";
import { Stars } from "@/shared/ui/Stars";

// Most visitors only read: the form loads when someone starts writing.
const ReviewDialog = dynamic(() => import("./ReviewDialog").then((m) => m.ReviewDialog), { ssr: false });

const card = "rounded-[var(--radius-card)] border border-border bg-surface";

/**
 * Reviews of a product: the average with the bars on the left, the reviews on the right.
 * Customers write in a window; guests go to the login page and come back here. The shop team moderates in the admin panel.
 */
export function ProductReviews({ slug, productName, initial }: { slug: string; productName: string; initial: ReviewsPage | null }) {
  const { t, locale } = useI18n();
  const r = t.product.reviews;
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { signedIn, isStaff, isCustomer } = useMe();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const listKey = ["product-reviews", slug];
  const mineKey = ["my-review", slug];

  const list = useInfiniteQuery({
    queryKey: listKey,
    queryFn: ({ pageParam }) => bff<ReviewsPage>(`/api/proxy/products/${encodeURIComponent(slug)}/reviews?page=${pageParam}`, { method: "GET" }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    initialData: initial ? { pages: [initial], pageParams: [1] } : undefined,
    staleTime: 60_000,
  });

  const { data: mine } = useQuery({
    queryKey: mineKey,
    queryFn: async () => (await bff<{ data: Review | null }>(`/api/proxy/products/${encodeURIComponent(slug)}/reviews/mine`, { method: "GET" })).data,
    enabled: isCustomer,
  });

  const reviews = list.data?.pages.flatMap((page) => page.data) ?? [];
  const summary = list.data?.pages[0]?.summary;
  const total = summary?.count ?? 0;
  const counted = `${total} ${plural(locale, total, r.count)}`;

  const write = () => {
    setMounted(true);
    setOpen(true);
  };

  const onSaved = () => {
    void queryClient.invalidateQueries({ queryKey: listKey });
    void queryClient.invalidateQueries({ queryKey: mineKey });
    // The stars next to the title and on the cards come from the server.
    router.refresh();
  };

  const action = isStaff ? null : !signedIn ? (
    <Link href={`${routes.login}?next=${encodeURIComponent(`${pathname}#reviews`)}`} className={buttonClasses({ variant: "outline", className: "transition duration-200 hover:-translate-y-0.5" })}>
      <MessageSquarePlus className="size-4" />
      {r.write}
    </Link>
  ) : (
    <Button type="button" variant={mine ? "outline" : "primary"} onClick={write} className="transition duration-200 hover:-translate-y-0.5">
      {mine ? <Pencil className="size-4" /> : <MessageSquarePlus className="size-4" />}
      {mine ? r.edit : r.write}
    </Button>
  );

  return (
    <section id="reviews" className="mt-12 scroll-mt-28">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">
          {r.title}
          {total > 0 && <span className="ml-2 font-semibold text-muted-foreground">{total}</span>}
        </h2>
        {total > 0 && action}
      </div>

      {total === 0 ? (
        <div className="grid place-items-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-12 text-center">
          <Stars value={0} size="lg" label={r.emptyTitle} />
          <p className="mt-4 font-bold">{r.emptyTitle}</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{r.emptyText}</p>
          {action && <div className="mt-5">{action}</div>}
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className={cn("p-5 sm:p-6 lg:sticky lg:top-32", card)}>
            <div className="flex items-center gap-4">
              <span className="font-display text-5xl font-extrabold tabular-nums">{summary?.average?.toFixed(1)}</span>
              <span className="min-w-0">
                <Stars value={summary?.average ?? 0} size="md" label={fmt(r.outOfFive, { value: summary?.average ?? 0 })} />
                <span className="mt-1 block text-sm text-muted-foreground">{counted}</span>
              </span>
            </div>
            <ul className="mt-5 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const amount = summary?.stars[String(stars)] ?? 0;

                return (
                  <li key={stars} className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-0.5 font-semibold tabular-nums">
                      {stars}
                      <Star aria-hidden className="size-3 fill-brand text-brand" />
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${total ? (amount / total) * 100 : 0}%` }} />
                    </span>
                    <span className="text-right text-xs tabular-nums text-muted-foreground">{amount}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="min-w-0">
            <ul className="space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className={cn("p-4 transition-colors duration-200 hover:border-foreground/20 sm:p-5", card)}>
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display font-extrabold text-brand">
                      {(review.author ?? r.anonymous).charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <b className="text-sm">{review.author ?? r.anonymous}</b>
                        {review.id === mine?.id && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-foreground">{r.mine}</span>}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <Stars value={review.rating} size="xs" label={fmt(r.outOfFive, { value: review.rating })} />
                        <time dateTime={review.created_at} className="text-xs text-muted-foreground">
                          {formatDate(review.created_at, locale)}
                        </time>
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed">{review.body}</p>
                </li>
              ))}
            </ul>
            {list.hasNextPage && (
              <Button type="button" variant="outline" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage} className="mt-3 w-full">
                {list.isFetchingNextPage && <LoaderCircle className="size-4 animate-spin" />}
                {r.more}
              </Button>
            )}
          </div>
        </div>
      )}

      {mounted && <ReviewDialog slug={slug} productName={productName} mine={mine ?? null} open={open} onOpenChange={setOpen} onSaved={onSaved} />}
    </section>
  );
}
