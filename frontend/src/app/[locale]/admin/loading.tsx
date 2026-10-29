import { Skeleton } from "@/shared/ui/kit/skeleton";
import { ListSkeleton } from "@/shared/ui/PageSkeletons";

/** Shown at once while an admin page loads (after sign-in or a menu click): title, filters, list. */
export default function AdminLoading() {
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-11 w-full rounded-xl sm:w-80" />
        <Skeleton className="h-11 w-44 rounded-xl" />
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>
      <ListSkeleton rows={7} />
    </div>
  );
}
