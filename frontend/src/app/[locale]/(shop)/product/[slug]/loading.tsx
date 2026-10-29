import { Container } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/kit/skeleton";

/** Product page: gallery with thumbnails on the left, name, price, buttons and specs on the right. */
export default function ProductLoading() {
  return (
    <Container className="py-8">
      <Skeleton className="h-4 w-64 max-w-full" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <Skeleton className="aspect-square rounded-[var(--radius-card)]" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-20 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-2/3 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-13 w-36 rounded-xl" />
            <Skeleton className="h-13 flex-1 rounded-xl" />
          </div>
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
