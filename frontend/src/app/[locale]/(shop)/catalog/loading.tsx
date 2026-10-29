import { Container } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { HeadingSkeleton, ProductGridSkeleton } from "@/shared/ui/PageSkeletons";

/** Catalog: categories on the left (a row of chips on phones), sorting and product cards on the right. */
export default function CatalogLoading() {
  return (
    <Container className="py-8">
      <HeadingSkeleton />
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] [&>*]:min-w-0">
        <div>
          <div className="flex gap-2 overflow-hidden lg:block lg:space-y-1.5">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full lg:h-11 lg:w-full lg:rounded-xl" />
            ))}
          </div>
          <Skeleton className="mt-6 hidden h-72 rounded-[var(--radius-card)] lg:block" />
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>
          <ProductGridSkeleton count={9} className="lg:grid-cols-3" />
        </div>
      </div>
    </Container>
  );
}
