import { Container } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/kit/skeleton";

/** A post: meta line, title, cover and paragraphs. */
export default function ArticleLoading() {
  return (
    <Container className="py-8">
      <Skeleton className="h-4 w-64 max-w-full" />
      <div className="mx-auto mt-6 max-w-3xl">
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="mt-4 h-10 w-full rounded-lg" />
        <Skeleton className="mt-2 h-10 w-3/4 rounded-lg" />
        <Skeleton className="mt-6 aspect-video rounded-[var(--radius-card)]" />
        <div className="mt-6 space-y-3">
          {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"].map((width, i) => (
            <Skeleton key={i} className={`h-4 ${width}`} />
          ))}
        </div>
      </div>
    </Container>
  );
}
