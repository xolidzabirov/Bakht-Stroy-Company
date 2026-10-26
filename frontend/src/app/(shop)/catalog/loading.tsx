import { Container } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/kit/skeleton";

/** Skeleton while the catalog loads (shadcn/ui Skeleton). */
export default function CatalogLoading() {
  return (
    <Container className="py-8">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-6 h-9 w-72 rounded-lg" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-11 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    </Container>
  );
}
