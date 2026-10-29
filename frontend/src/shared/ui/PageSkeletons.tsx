import { cn } from "@/shared/lib/cn";
import { Container } from "./Container";
import { Skeleton } from "./kit/skeleton";

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

/** "Главная › Каталог" and the page title. */
export function HeadingSkeleton({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div>
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-6 h-9 w-72 max-w-full rounded-lg" />
      {subtitle && <Skeleton className="mt-3 h-4 w-96 max-w-full" />}
    </div>
  );
}

/** One product card: square photo, category, name, price, button. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-4 h-6 w-24" />
        <Skeleton className="mt-3 h-11 w-full rounded-xl" />
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

/** A news card: wide cover and two lines. */
export function NewsCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-2.5 p-5">
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="mt-4 h-3 w-28" />
      </div>
    </div>
  );
}

/** Rows of a list (orders, users, messages). */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {range(rows).map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="hidden h-8 w-24 rounded-lg sm:block" />
        </div>
      ))}
    </div>
  );
}

/** A generic shop page: heading and a grid of cards. */
export function ShopPageSkeleton() {
  return (
    <Container className="py-8">
      <HeadingSkeleton />
      <ProductGridSkeleton className="mt-8" />
    </Container>
  );
}
