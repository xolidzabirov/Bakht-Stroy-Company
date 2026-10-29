import { cn } from "@/shared/lib/cn";

/** A grey placeholder with a soft light sweeping across it (like Instagram) while the real content loads. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("skeleton-shimmer rounded-md", className)} {...props} />;
}

export { Skeleton };
