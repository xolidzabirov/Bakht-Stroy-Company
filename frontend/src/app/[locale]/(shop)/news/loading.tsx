import { Container } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { HeadingSkeleton, NewsCardSkeleton } from "@/shared/ui/PageSkeletons";

/** News list: tabs and cards with covers. */
export default function NewsLoading() {
  return (
    <Container className="py-8">
      <HeadingSkeleton />
      <div className="mt-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-32 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}
