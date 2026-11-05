import { cn } from "@/shared/lib/cn";
import { Skeleton } from "./kit/skeleton";

export const range = (count: number) => Array.from({ length: count }, (_, i) => i);

/**
 * Text on its way. It takes the classes of the real text, so each line is exactly as tall as the real one
 * on any screen and nothing jumps when the page arrives. Several lines: pass their widths.
 */
export function SkeletonText({ className, w = "w-full", lines }: { className?: string; w?: string; lines?: string[] }) {
  return (
    <div className={className}>
      {(lines ?? [w]).map((width, i) => (
        <span key={i} className="block">
          <span className={cn("skeleton-shimmer inline-block h-[0.72em] max-w-full rounded-[0.28em] align-middle", width)} />
        </span>
      ))}
    </div>
  );
}

/** A label with its input, like shared/ui/Field. */
export function FieldSkeleton({ className, label = "w-24", input = "h-12" }: { className?: string; label?: string; input?: string }) {
  return (
    <div className={className}>
      <SkeletonText className="mb-1.5 text-sm leading-5" w={label} />
      <Skeleton className={cn("rounded-xl", input)} />
    </div>
  );
}

export function BreadcrumbsSkeleton({ w = "w-52" }: { w?: string }) {
  return <SkeletonText className="text-sm" w={w} />;
}

/** The title row of a section, like shared/ui/SectionHeading. */
export function SectionHeadingSkeleton({ title = "w-64", subtitle = "w-80" }: { title?: string; subtitle?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4 sm:mb-10">
      <div className="min-w-0 flex-1">
        <SkeletonText className="text-3xl font-extrabold sm:text-4xl" w={title} />
        <SkeletonText className="mt-2 text-sm sm:text-base" w={subtitle} />
      </div>
      <SkeletonText className="hidden shrink-0 text-sm sm:block" w="w-24" />
    </div>
  );
}

/** A product card, like entities/product/ui/ProductCard: with a mouse the buttons wait for a hover there too. */
export function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <SkeletonText className="mb-1 text-xs" w="w-20" />
        <SkeletonText className="min-h-[2.75rem] font-semibold leading-snug" lines={["w-full", "w-2/3"]} />
        <div className="mt-auto pt-4">
          <SkeletonText className="font-display text-xl font-bold" w="w-24" />
          <SkeletonText className="text-xs" w="w-16" />
          <SkeletonText className="mt-1.5 text-xs" w="w-20" />
          <div className="@container mt-3 can-hover:hidden">
            <div className="flex flex-col gap-2 @[15rem]:flex-row">
              <Skeleton className="h-9 rounded-xl @[15rem]:flex-1" />
              <Skeleton className="h-9 rounded-xl @[15rem]:w-28" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>
      {range(count).map((i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A news card, like entities/news/ui/NewsCard. */
export function NewsCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="flex flex-1 flex-col p-5">
        <SkeletonText className="font-display text-lg font-bold" lines={["w-full", "w-3/5"]} />
        <SkeletonText className="mt-2 text-sm" lines={["w-full", "w-4/5"]} />
        <SkeletonText className="mt-auto pt-4 text-xs" w="w-28" />
      </div>
    </div>
  );
}

/** A customer's order in a list, like entities/order/ui/OrderCard. */
export function OrderCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <Skeleton className="hidden size-12 shrink-0 rounded-xl sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonText className="font-bold" w="w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <SkeletonText className="mt-1 text-sm" w="w-48" />
      </div>
      <Skeleton className="size-5 shrink-0 rounded" />
    </div>
  );
}

/** Messages on their way, on the wall of the chat: the two sides take turns, as in a real conversation. */
export function ChatBubblesSkeleton() {
  const bubbles = [
    { out: false, w: "w-44", h: "h-10" },
    { out: false, w: "w-64", h: "h-16" },
    { out: true, w: "w-36", h: "h-10" },
    { out: false, w: "w-52", h: "h-10" },
    { out: true, w: "w-72", h: "h-16" },
    { out: true, w: "w-28", h: "h-10" },
    { out: false, w: "w-60", h: "h-10" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col justify-end gap-1.5" aria-hidden>
      {bubbles.map(({ out, w, h }, i) => (
        <Skeleton key={i} className={cn("max-w-[75%] rounded-[18px] bg-surface dark:bg-[#26262b]", out ? "self-end rounded-br-md" : "self-start rounded-bl-md", i > 0 && bubbles[i - 1].out !== out && "mt-2", w, h)} />
      ))}
    </div>
  );
}

/** Rows of the manager's inbox, like the list in widgets/chat/ui/StaffChats. */
export function InboxRowsSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <>
      {range(rows).map((i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl px-2.5 py-2" aria-hidden>
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <SkeletonText className="min-w-0 flex-1 text-sm font-bold" w={i % 2 ? "w-3/5" : "w-2/5"} />
              <SkeletonText className="shrink-0 text-[11px]" w="w-9" />
            </div>
            <SkeletonText className="mt-0.5 text-[13px]" w={i % 3 ? "w-4/5" : "w-3/5"} />
          </div>
        </li>
      ))}
    </>
  );
}
