import { Skeleton } from "@/shared/ui/kit/skeleton";
import { FieldSkeleton, range, SkeletonText } from "@/shared/ui/PageSkeletons";

/** Sign-in pages while they load: the dark side stays from the layout, the form repeats its own fields. */

function SocialSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <Skeleton className="h-3 w-6" />
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function LoginSkeleton() {
  return (
    <div aria-busy>
      <SkeletonText className="text-3xl font-extrabold" w="w-28" />
      <SkeletonText className="mt-2" w="w-80 max-w-full" />
      <div className="mt-8 space-y-5">
        <FieldSkeleton label="w-12" />
        <FieldSkeleton label="w-16" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-5 rounded-md" />
          <SkeletonText className="text-sm" w="w-56" />
        </div>
        <Skeleton className="h-13 rounded-xl" />
        <SocialSkeleton />
        <SkeletonText className="text-center text-sm" w="w-52" />
      </div>
    </div>
  );
}

export function RegisterSkeleton() {
  return (
    <div aria-busy>
      <div className="mb-8">
        <div className="grid grid-cols-5 gap-2">
          {range(5).map((i) => (
            <Skeleton key={i} className="h-1.5 rounded-full" />
          ))}
        </div>
        <SkeletonText className="mt-3 text-sm" w="w-32" />
      </div>
      <SkeletonText className="text-3xl font-extrabold sm:text-4xl" w="w-56" />
      <SkeletonText className="mt-2" lines={["w-full", "w-1/2"]} />
      <div className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <FieldSkeleton label="w-10" />
          <FieldSkeleton label="w-16" />
        </div>
        <Skeleton className="h-13 rounded-xl" />
        <SkeletonText className="text-center text-sm" w="w-44" />
        <SocialSkeleton />
      </div>
    </div>
  );
}

export function ForgotPasswordSkeleton() {
  return (
    <div aria-busy>
      <SkeletonText className="text-3xl font-extrabold" w="w-64 max-w-full" />
      <SkeletonText className="mt-2" lines={["w-full", "w-2/3"]} />
      <div className="mt-8 space-y-5">
        <div>
          <FieldSkeleton label="w-24" />
          <SkeletonText className="mt-1.5 text-xs" w="w-4/5" />
        </div>
        <Skeleton className="h-13 rounded-xl" />
      </div>
      <SkeletonText className="mt-6 text-center text-sm" w="w-44" />
    </div>
  );
}
