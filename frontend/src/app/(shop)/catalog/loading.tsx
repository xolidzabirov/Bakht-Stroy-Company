import { Container } from "@/shared/ui";

/** Skeleton while the catalog loads. */
export default function CatalogLoading() {
  return (
    <Container className="animate-pulse py-8">
      <div className="h-4 w-48 rounded bg-surface-muted" />
      <div className="mt-6 h-9 w-72 rounded-lg bg-surface-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="h-11 rounded-xl bg-surface-muted" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[3/4] rounded-[var(--radius-card)] bg-surface-muted" />
          ))}
        </div>
      </div>
    </Container>
  );
}
