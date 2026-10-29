import { Skeleton } from "@/shared/ui/kit/skeleton";

/** Account sections: title and a few cards (the side menu stays from the layout). */
export default function AccountLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-56 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
