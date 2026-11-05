import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { ChatBubblesSkeleton, FieldSkeleton, OrderCardSkeleton, range, SkeletonText } from "@/shared/ui/PageSkeletons";

/** The customer's account while it loads: each section repeats its page, the shell repeats the account's layout. */

const box = "rounded-2xl border border-border bg-surface";
const pageTitle = "text-3xl font-extrabold";

/** The dark band with the avatar, like shared/ui/ProfileBand. */
export function ProfileBandSkeleton() {
  return (
    <section className="skeleton-on-dark overflow-hidden rounded-2xl bg-ink">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <SkeletonText className="text-xl font-bold sm:text-2xl" w="w-48" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <SkeletonText className="text-sm" w="w-40" />
            <SkeletonText className="text-sm" w="w-32" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** A section of settings with its rows, like shared/ui/admin/Settings. */
export function SettingsSectionSkeleton({ title = "w-36", rows = 3, text = true, edit = false }: { title?: string; rows?: number; text?: boolean; edit?: boolean }) {
  return (
    <section className={cn("overflow-hidden", box)}>
      <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <SkeletonText className="font-semibold" w={title} />
          {text && <SkeletonText className="mt-0.5 text-sm" w="w-4/5" />}
        </div>
        {edit && <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />}
      </div>
      <div className="divide-y divide-border px-5 sm:px-6">
        {range(rows).map((i) => (
          <div key={i} className="grid gap-1.5 py-3.5 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] sm:items-baseline sm:gap-5">
            <SkeletonText className="text-sm" w="w-24" />
            <div className="flex min-w-0 items-center justify-between gap-3">
              <SkeletonText className="min-w-0 flex-1 text-sm" w={i % 2 ? "w-2/5" : "w-3/5"} />
              {!edit && <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AccountOverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div>
        <SkeletonText className={pageTitle} w="w-64 max-w-full" />
        <SkeletonText className="mt-1" w="w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {range(4).map((i) => (
          <div key={i} className={cn("p-5", box)}>
            <Skeleton className="size-5 rounded" />
            <SkeletonText className="mt-3 font-display text-2xl font-extrabold" w="w-16" />
            <SkeletonText className="text-sm" w="w-24" />
          </div>
        ))}
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SkeletonText className="text-lg font-extrabold" w="w-40" />
          <SkeletonText className="text-sm font-semibold" w="w-20" />
        </div>
        <div className="space-y-3">
          {range(3).map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        {range(3).map((i) => (
          <div key={i} className={cn("flex items-center gap-3 p-4", box)}>
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <SkeletonText className="min-w-0 flex-1 text-sm" lines={["w-full", "w-2/3"]} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccountOrdersSkeleton() {
  return (
    <div aria-busy>
      <SkeletonText className={pageTitle} w="w-44" />
      <div className="mt-5 flex flex-wrap gap-2 pb-1">
        {["w-16", "w-24", "w-28", "w-24"].map((width, i) => (
          <Skeleton key={i} className={cn("h-[38px] shrink-0 rounded-full", width)} />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {range(6).map((i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function AccountOrderSkeleton() {
  return (
    <div className="space-y-5" aria-busy>
      <SkeletonText className="text-sm font-semibold" w="w-32" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SkeletonText className={pageTitle} w="w-52" />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <SkeletonText className="text-sm" w="w-28" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-40 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>
      <section className={cn("p-5 sm:p-6", box)}>
        <SkeletonText className="mb-5 font-extrabold" w="w-32" />
        <div className="grid grid-cols-5 gap-2">
          {range(5).map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="size-9 rounded-full" />
              <SkeletonText className="w-full text-center text-xs" w="w-4/5" />
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <section className={cn("overflow-hidden", box)}>
          <div className="border-b border-border px-5 py-4">
            <SkeletonText className="font-extrabold" w="w-24" />
          </div>
          <div className="divide-y divide-border">
            {range(3).map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 text-sm">
                  <SkeletonText className="font-semibold" w="w-3/4" />
                  <SkeletonText className="mt-0.5" w="w-1/3" />
                </div>
                <SkeletonText className="text-sm font-semibold" w="w-20" />
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border px-5 py-4 text-sm">
            <div className="flex justify-between gap-4">
              <SkeletonText className="flex-1" w="w-20" />
              <SkeletonText className="flex-1 text-right font-semibold" w="w-16" />
            </div>
            <div className="flex justify-between gap-4">
              <SkeletonText className="flex-1" w="w-16" />
              <SkeletonText className="flex-1 text-right font-semibold" w="w-14" />
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-1">
              <SkeletonText className="font-semibold" w="w-14" />
              <SkeletonText className="font-display text-2xl font-extrabold" w="w-28" />
            </div>
          </div>
        </section>
        <div className="space-y-5">
          <section className={cn("space-y-4 p-5", box)}>
            {range(3).map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-5 shrink-0 rounded" />
                <div className="min-w-0 flex-1 text-sm">
                  <SkeletonText className="font-semibold" w="w-1/3" />
                  <SkeletonText className="mt-0.5" w="w-4/5" />
                </div>
              </div>
            ))}
          </section>
          <section className={cn("p-5", box)}>
            <SkeletonText className="font-extrabold" w="w-24" />
            <div className="mt-4 space-y-4 border-l-2 border-border pl-5">
              {range(3).map((i) => (
                <SkeletonText key={i} className="text-sm" w={i % 2 ? "w-2/5" : "w-3/5"} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AccountAddressesSkeleton() {
  return (
    <div aria-busy>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SkeletonText className={pageTitle} w="w-40" />
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {range(4).map((i) => (
          <div key={i} className={cn("flex flex-col p-5", box)}>
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <SkeletonText className="font-bold" w="w-28" />
                <SkeletonText className="mt-0.5 text-sm" w="w-4/5" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="ml-auto h-9 w-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccountNotificationsSkeleton() {
  return (
    <div aria-busy>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SkeletonText className={pageTitle} w="w-52" />
        <Skeleton className="h-9 w-44 rounded-xl" />
      </div>
      <div className="mt-5 space-y-2">
        {range(6).map((i) => (
          <div key={i} className={cn("flex gap-4 p-4", box)}>
            <Skeleton className="mt-1 size-2.5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <SkeletonText className="font-semibold" w={i % 2 ? "w-2/5" : "w-3/5"} />
              <SkeletonText className="text-sm" w="w-4/5" />
              <SkeletonText className="mt-2 text-xs" w="w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The customer's chat: its header, the wall with messages, the composer. */
export function AccountChatSkeleton() {
  return (
    <div className="-mx-4 -mt-6 h-[calc(100dvh-4rem-4.5rem)] overflow-hidden border-border bg-surface sm:mx-0 sm:mt-0 sm:h-[calc(100dvh-10rem)] sm:rounded-2xl sm:border lg:h-[calc(100dvh-8.5rem)]" aria-busy>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <SkeletonText className="font-bold" w="w-32" />
            <SkeletonText className="text-xs" w="w-24" />
          </div>
        </div>
        <div className="chat-wall flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-4 py-3 sm:px-6">
          <ChatBubblesSkeleton />
          <div className="mx-auto mt-3 flex w-full max-w-3xl items-end gap-1.5">
            <Skeleton className="size-11 shrink-0 rounded-full bg-surface dark:bg-[#26262b]" />
            <Skeleton className="h-11 min-w-0 flex-1 rounded-3xl bg-surface dark:bg-[#26262b]" />
            <Skeleton className="size-11 shrink-0 rounded-full bg-surface dark:bg-[#26262b]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccountProfileSkeleton() {
  return (
    <div className="space-y-5" aria-busy>
      <SkeletonText className={pageTitle} w="w-52" />
      <ProfileBandSkeleton />
      <SettingsSectionSkeleton title="w-40" rows={2} edit />
      <SettingsSectionSkeleton title="w-36" rows={2} />
    </div>
  );
}

function SettingsBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cn("p-5 sm:p-6", box)}>
      <SkeletonText className="mb-4 text-lg font-extrabold" w={title} />
      {children}
    </section>
  );
}

export function AccountSettingsSkeleton() {
  return (
    <div className="space-y-5" aria-busy>
      <SkeletonText className={pageTitle} w="w-44" />
      <SettingsBox title="w-40">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldSkeleton className="sm:col-span-2 sm:max-w-sm" label="w-32" />
          <FieldSkeleton label="w-28" />
          <FieldSkeleton label="w-36" />
          <Skeleton className="h-11 w-40 rounded-xl sm:col-span-2" />
        </div>
      </SettingsBox>
      <SettingsBox title="w-36">
        <SkeletonText className="-mt-3 text-sm" w="w-3/5" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-20 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </SettingsBox>
      <SettingsBox title="w-44">
        <div className="divide-y divide-border">
          {range(2).map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="size-5 shrink-0 rounded" />
              <div className="min-w-0 flex-1 text-sm">
                <SkeletonText className="font-semibold" w="w-40" />
                <SkeletonText className="text-xs" w="w-28" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </SettingsBox>
      <SettingsBox title="w-44">
        <SkeletonText className="text-sm" w="w-4/5" />
        <Skeleton className="mt-4 h-9 w-40 rounded-xl" />
      </SettingsBox>
    </div>
  );
}

/** Which section's skeleton stands inside the shell on a first visit. */
function accountSection(path: string) {
  if (path === "/account/orders") return <AccountOrdersSkeleton />;
  if (path.startsWith("/account/orders/")) return <AccountOrderSkeleton />;
  if (path.startsWith("/account/addresses")) return <AccountAddressesSkeleton />;
  if (path.startsWith("/account/notifications")) return <AccountNotificationsSkeleton />;
  if (path.startsWith("/account/chat")) return <AccountChatSkeleton />;
  if (path.startsWith("/account/profile")) return <AccountProfileSkeleton />;
  if (path.startsWith("/account/settings")) return <AccountSettingsSkeleton />;

  return <AccountOverviewSkeleton />;
}

/** The whole account on a first visit, until the session and the counters are known: top bar, side menu, bottom tabs. */
export function AccountShellSkeleton({ path }: { path: string }) {
  return (
    <div className="min-h-dvh bg-background" aria-busy>
      <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="hidden h-9 w-24 rounded-full sm:block" />
            <Skeleton className="h-10 w-20 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:pb-12">
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className={cn("flex items-center gap-3 p-4", box)}>
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonText className="font-bold" w="w-3/4" />
                <SkeletonText className="text-xs" w="w-full" />
              </div>
            </div>
            <div className="space-y-1">
              {range(8).map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                  <Skeleton className="size-5 shrink-0 rounded" />
                  <SkeletonText className="min-w-0 flex-1 text-sm font-semibold" w={i % 2 ? "w-3/5" : "w-2/5"} />
                </div>
              ))}
            </div>
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>
        <div className="min-w-0">{accountSection(path)}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="flex overflow-hidden">
          {range(6).map((i) => (
            <div key={i} className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 py-2.5">
              <Skeleton className="size-5 rounded" />
              <SkeletonText className="w-full text-center text-[10px] font-semibold" w="w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
