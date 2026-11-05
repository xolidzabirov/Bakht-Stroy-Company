import { adminPath } from "@/shared/config/auth";
import { cn } from "@/shared/lib/cn";
import { LogoMark } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { ChatBubblesSkeleton, FieldSkeleton, InboxRowsSkeleton, range, SkeletonText } from "@/shared/ui/PageSkeletons";
import { ProductReviewsPanelSkeleton } from "@/widgets/admin-product-reviews/ui/ProductReviewsPanel";
import { ProfileBandSkeleton, SettingsSectionSkeleton } from "./AccountSkeletons";

/** The admin panel while it loads: each page repeats its real layout, the shell repeats the panel around it. */

const box = "rounded-2xl border border-border bg-surface";

function HeaderSkeleton({ title = "w-40", text = "w-24", icon = true, back = false, action }: { title?: string; text?: string | null; icon?: boolean; back?: boolean; action?: React.ReactNode }) {
  return (
    <div className="mb-6">
      {back && <SkeletonText className="mb-3 text-sm font-medium" w="w-28" />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          {icon && <Skeleton className="hidden size-11 shrink-0 rounded-xl sm:block" />}
          <div className="min-w-0">
            <SkeletonText className="font-display text-2xl font-extrabold sm:text-[28px]" w={title} />
            {text && <SkeletonText className="mt-0.5 text-sm" w={text} />}
          </div>
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

function PanelSkeleton({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]", box, className)}>
      {title && (
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <SkeletonText className="min-w-0 flex-1 font-display text-[15px] font-bold" w={title} />
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Pills of a tab filter, like features/admin-filters. */
function PillsSkeleton({ widths, className }: { widths: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5 pb-1", className)}>
      {widths.map((width, i) => (
        <Skeleton key={i} className={cn("h-[34px] shrink-0 rounded-full", width)} />
      ))}
    </div>
  );
}

const Search = () => <Skeleton className="h-10 min-w-40 flex-1 rounded-xl sm:min-w-56" />;
const FiltersButton = () => <Skeleton className="h-10 w-[7.5rem] shrink-0 rounded-xl md:hidden" />;
const Filter = ({ w = "w-40", className }: { w?: string; className?: string }) => <Skeleton className={cn("h-10 rounded-xl", w, className)} />;

/** Dashboard: the dark revenue card and four figures, three charts, statuses and top products, catalog and low stock. */
const CHART_BARS = [0, 22, 0, 0, 0, 22, 0, 62, 22, 40, 40, 22, 0, 0, 22, 40, 22, 40, 40, 0, 0, 0, 0, 0, 22, 0, 0, 0, 40, 18];

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy>
      <HeaderSkeleton title="w-36" text="w-56" action={<PillsSkeleton className="pb-0" widths={["w-20", "w-20", "w-20"]} />} />

      <div className="grid gap-3 lg:grid-cols-[1.3fr_2fr] [&>*]:min-w-0">
        <section className="skeleton-on-dark flex flex-col justify-between overflow-hidden rounded-2xl bg-ink p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <SkeletonText className="text-sm font-semibold" w="w-44" />
          </div>
          <SkeletonText className="mt-5 font-display text-4xl font-extrabold sm:text-5xl" w="w-64 max-w-full" />
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 pt-4">
            <SkeletonText className="text-sm" w="w-44" />
            <SkeletonText className="text-sm" w="w-36" />
          </div>
        </section>
        <div className="grid grid-cols-2 gap-3">
          {range(4).map((i) => (
            <div key={i} className={cn("p-4 sm:p-5", box)}>
              <div className="flex items-start justify-between gap-2">
                <SkeletonText className="min-w-0 flex-1 text-sm font-medium" w="w-2/3" />
                <Skeleton className="size-9 shrink-0 rounded-lg" />
              </div>
              <SkeletonText className="mt-2 font-display text-xl font-extrabold sm:text-[28px]" w="w-20" />
              <SkeletonText className="mt-1 text-xs" w="w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3 [&>*]:min-w-0">
        {range(3).map((chart) => (
          <PanelSkeleton key={chart}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <SkeletonText className="text-sm font-bold" w="w-20" />
              <SkeletonText className="text-sm font-semibold" w="w-12" />
            </div>
            <div className="flex h-44 gap-2">
              <div className="flex w-9 shrink-0 flex-col justify-between pb-5">
                {range(3).map((i) => (
                  <Skeleton key={i} className="ml-auto h-2 w-6" />
                ))}
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="absolute inset-x-0 bottom-5 top-0 flex items-end gap-[2px] border-b border-border">
                  {CHART_BARS.map((height, i) => (
                    <div key={i} className="flex h-full min-w-0 flex-1 items-end justify-center">
                      {height > 0 && <Skeleton className="w-full max-w-6 rounded-b-none rounded-t-[4px]" style={{ height: `${height + chart * 6}%` }} />}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex justify-between">
                  <Skeleton className="h-2 w-8" />
                  <Skeleton className="h-2 w-8" />
                </div>
              </div>
            </div>
            <SkeletonText className="mt-2 text-xs" w="w-28" />
          </PanelSkeleton>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <PanelSkeleton title="w-40">
          <div className="space-y-2.5">
            {["w-2/5", "w-1/4", "w-0", "w-1/4", "w-full", "w-2/5"].map((width, i) => (
              <div key={i} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 sm:grid-cols-[8rem_1fr_2.5rem]">
                <SkeletonText className="text-sm font-medium" w="w-20" />
                <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <Skeleton className={cn("h-full rounded-full", width)} />
                </span>
                <SkeletonText className="text-right text-sm font-semibold" w="w-5" />
              </div>
            ))}
          </div>
        </PanelSkeleton>
        <PanelSkeleton title="w-32">
          <div className="divide-y divide-border">
            {range(5).map((i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 text-sm">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <SkeletonText className="min-w-0 flex-1 font-medium" w={i % 2 ? "w-2/3" : "w-1/2"} />
                <SkeletonText className="shrink-0" w="w-28" />
              </div>
            ))}
          </div>
        </PanelSkeleton>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_2fr] [&>*]:min-w-0">
        <PanelSkeleton title="w-20">
          <div className="grid grid-cols-2 gap-2">
            {range(6).map((i) => (
              <div key={i} className="rounded-xl border border-border p-3">
                <SkeletonText className="text-xl font-extrabold" w="w-10" />
                <SkeletonText className="text-xs" w="w-16" />
              </div>
            ))}
          </div>
        </PanelSkeleton>
        <PanelSkeleton title="w-36" actions={<SkeletonText className="text-sm font-semibold" w="w-16" />}>
          <div className="divide-y divide-border">
            {range(4).map((i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 text-sm">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <SkeletonText className="min-w-0 flex-1 font-medium" w={i % 2 ? "w-2/3" : "w-1/2"} />
                <SkeletonText className="shrink-0 font-semibold" w="w-20" />
              </div>
            ))}
          </div>
        </PanelSkeleton>
      </div>
    </div>
  );
}

const ORDER_COLUMNS = ["w-14", "w-24", "w-14", "w-14", "w-16", "w-12"];

export function AdminOrdersSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-28" text="w-20" />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="hidden w-full md:mb-1 md:block">
          <PillsSkeleton widths={["w-14", "w-24", "w-20", "w-36", "w-28", "w-20", "w-32", "w-28"]} />
        </div>
        <Search />
        <FiltersButton />
        <Filter className="hidden md:block" />
        <Filter className="hidden md:block" />
        <Filter w="w-48" className="hidden md:block" />
        <Filter w="w-48" className="hidden md:block" />
      </div>
      <div className={cn("hidden overflow-hidden md:block", box)}>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs">
            <tr>
              {ORDER_COLUMNS.map((width, i) => (
                <th key={i} className="px-4 py-3 text-left font-semibold">
                  <SkeletonText className={i === 5 ? "text-right" : undefined} w={width} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {range(10).map((row) => (
              <tr key={row}>
                <td className="px-4 py-3">
                  <SkeletonText className="font-bold" w="w-24" />
                  <SkeletonText className="text-xs" w="w-20" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonText w="w-32" />
                  <SkeletonText className="text-xs" w="w-28" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-28 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonText w="w-20" />
                </td>
                <td className="px-4 py-3 text-right">
                  <SkeletonText className="font-semibold" w="w-20" />
                  <SkeletonText className="text-xs" w="w-10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 md:hidden">
        {range(7).map((i) => (
          <div key={i} className={cn("block p-4", box)}>
            <div className="flex items-center justify-between gap-2">
              <SkeletonText className="font-bold" w="w-24" />
              <SkeletonText className="font-bold" w="w-20" />
            </div>
            <SkeletonText className="mt-1 text-sm" w="w-52 max-w-full" />
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <SkeletonText className="ml-auto text-xs" w="w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SumRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="ml-auto mt-4 max-w-xs space-y-1.5 border-t border-border pt-4 text-sm">
      {range(rows).map((i) => (
        <div key={i} className="flex justify-between gap-4">
          <SkeletonText className="flex-1" w="w-16" />
          <SkeletonText className="flex-1 text-right" w="w-16" />
        </div>
      ))}
    </div>
  );
}

export function AdminOrderSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton back title="w-52" text="w-40" />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className="space-y-4">
          <PanelSkeleton title="w-24">
            <div className="-mx-4 divide-y divide-border sm:-mx-5">
              {range(3).map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Skeleton className="hidden size-11 shrink-0 rounded-lg sm:block" />
                  <div className="min-w-0 flex-1 text-sm">
                    <SkeletonText w="w-3/5" />
                    <SkeletonText className="text-xs" w="w-20" />
                  </div>
                  <SkeletonText className="hidden w-16 text-sm sm:block" w="w-14" />
                  <SkeletonText className="w-12 text-sm" w="w-10" />
                  <SkeletonText className="w-20 text-right text-sm font-semibold" w="w-16" />
                </div>
              ))}
            </div>
            <SumRows rows={4} />
          </PanelSkeleton>
          <PanelSkeleton title="w-24">
            <div className="space-y-4 border-l-2 border-border pl-5">
              {range(3).map((i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <SkeletonText className="text-xs" w="w-24" />
                  </div>
                  <SkeletonText className="mt-1 text-xs" w="w-36" />
                </div>
              ))}
            </div>
          </PanelSkeleton>
        </div>
        <div className="space-y-4">
          <PanelSkeleton title="w-32">
            <div className="grid gap-2">
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          </PanelSkeleton>
          <PanelSkeleton title="w-20">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <SkeletonText className="text-xs" w="w-20" />
            </div>
            <Skeleton className="h-11 rounded-xl" />
          </PanelSkeleton>
          <PanelSkeleton title="w-24">
            <SkeletonText className="font-bold" w="w-40" />
            <SkeletonText className="mt-2 text-sm font-semibold" w="w-36" />
            <SkeletonText className="mt-1 text-sm" w="w-44" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </PanelSkeleton>
          <PanelSkeleton title="w-24">
            <SkeletonText className="text-sm font-semibold" w="w-32" />
            <SkeletonText className="mt-1 text-sm" w="w-4/5" />
          </PanelSkeleton>
        </div>
      </div>
    </div>
  );
}

export function AdminProductsSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-28" text="w-20" action={<Skeleton className="h-11 w-44 rounded-xl" />} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Search />
        <FiltersButton />
        <Filter className="hidden md:block" />
        <Filter w="w-52" className="hidden md:block" />
        <div className="hidden w-full flex-wrap gap-2 md:mt-1 md:flex">
          {["w-32", "w-36", "w-24", "w-36", "w-36", "w-32", "w-36", "w-56", "w-28", "w-32", "w-20"].map((width, i) => (
            <Skeleton key={i} className={cn("h-9 shrink-0 rounded-full", width)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {range(8).map((i) => (
          <div key={i} className={cn("flex flex-col overflow-hidden", box)}>
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="flex flex-1 flex-col p-4 pb-3">
              <SkeletonText className="min-h-10 text-sm font-semibold" lines={["w-full", "w-2/3"]} />
              <SkeletonText className="mt-1 text-xs" w="w-3/4" />
              <SkeletonText className="mt-auto pt-3 font-bold" w="w-24" />
              <div className="mt-1.5 flex h-9 items-center gap-2">
                <Skeleton className="size-2 rounded-full" />
                <SkeletonText className="flex-1 text-sm" w="w-16" />
                <SkeletonText className="text-sm" w="w-10" />
              </div>
              <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-3">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-14 rounded-full" />
                <Skeleton className="ml-auto size-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cn("p-4 sm:p-5", box)}>
      <SkeletonText className="mb-4 text-base font-extrabold" w={title} />
      {children}
    </section>
  );
}

function SwitchRows({ rows }: { rows: number }) {
  return (
    <>
      {range(rows).map((i) => (
        <div key={i} className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
          <div className="min-w-0 flex-1">
            <SkeletonText className="text-sm font-semibold" w="w-3/5" />
            <SkeletonText className="text-xs" w="w-4/5" />
          </div>
          <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
        </div>
      ))}
    </>
  );
}

export function ProductFormSkeleton({ edit = false }: { edit?: boolean }) {
  return (
    <div aria-busy>
      <HeaderSkeleton back title="w-56 max-w-full" text={edit ? "w-44" : null} action={edit ? <Skeleton className="h-9 w-28 rounded-xl" /> : undefined} />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px] [&>*]:min-w-0">
        <div className="space-y-4">
          <FormSection title="w-24">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton className="sm:col-span-2" label="w-20" />
              <FieldSkeleton label="w-24" />
              <FieldSkeleton label="w-16" />
              <FieldSkeleton className="sm:col-span-2" label="w-36" />
              <FieldSkeleton className="sm:col-span-2" label="w-20" input="h-24" />
            </div>
          </FormSection>
          <FormSection title="w-28">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["w-20", "w-24", "w-20", "w-28", "w-24"].map((label, i) => (
                <FieldSkeleton key={i} label={label} />
              ))}
            </div>
          </FormSection>
          <FormSection title="w-32">
            <Skeleton className="h-9 w-48 rounded-xl" />
          </FormSection>
        </div>
        <div className="space-y-4">
          <FormSection title="w-16">
            <SwitchRows rows={2} />
          </FormSection>
          <div className={cn("p-4", box)}>
            <Skeleton className="h-11 rounded-xl" />
          </div>
          <FormSection title="w-28">
            <SkeletonText className="mb-3 text-xs" lines={["w-full", "w-2/3"]} />
            <div className="grid grid-cols-3 gap-2">
              {range(edit ? 3 : 0).map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
            <Skeleton className={cn("h-24 rounded-xl", edit && "mt-2")} />
          </FormSection>
        </div>
      </div>
      {edit && <ProductReviewsPanelSkeleton />}
    </div>
  );
}

const USER_COLUMNS = "lg:grid-cols-[1.4fr_1.2fr_8rem_9rem_7rem]";

export function AdminUsersSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-44" text="w-20" action={<Skeleton className="h-11 w-48 rounded-xl" />} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Search />
        <Filter />
        <Filter />
        <Filter />
      </div>
      <div className={cn("divide-y divide-border overflow-hidden", box)}>
        <div className={cn("hidden gap-3 bg-muted/60 px-4 py-3 text-xs lg:grid", USER_COLUMNS)}>
          {["w-24", "w-20", "w-12", "w-14", "w-16"].map((width) => (
            <SkeletonText key={width} className="font-semibold" w={width} />
          ))}
        </div>
        {range(10).map((i) => (
          <div key={i} className={cn("grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3", USER_COLUMNS)}>
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonText className="text-sm font-semibold" w="w-3/5" />
                <SkeletonText className="text-xs lg:hidden" w="w-4/5" />
              </div>
            </div>
            <div className="hidden min-w-0 text-sm lg:block">
              <SkeletonText w="w-4/5" />
              <SkeletonText className="text-xs" w="w-3/5" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <div className="hidden text-sm lg:block">
              <SkeletonText w="w-8" />
              <SkeletonText className="text-xs" w="w-16" />
            </div>
            <SkeletonText className="hidden text-xs lg:block" w="w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminUserSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton back title="w-56 max-w-full" text="w-32" />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px] [&>*]:min-w-0">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {range(3).map((i) => (
              <div key={i} className={cn("p-4", box)}>
                <SkeletonText className="text-2xl font-extrabold" w="w-16" />
                <SkeletonText className="text-sm" w="w-24" />
              </div>
            ))}
          </div>
          <PanelSkeleton title="w-28">
            <div className="divide-y divide-border">
              {range(4).map((i) => (
                <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                  <SkeletonText className="font-bold" w="w-24" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <SkeletonText className="ml-auto font-semibold" w="w-20" />
                </div>
              ))}
            </div>
          </PanelSkeleton>
          <PanelSkeleton title="w-24">
            <div className="grid gap-2 sm:grid-cols-2">
              {range(2).map((i) => (
                <div key={i} className="flex gap-2 rounded-xl border border-border p-3">
                  <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
                  <SkeletonText className="min-w-0 flex-1 text-sm" w="w-4/5" />
                </div>
              ))}
            </div>
          </PanelSkeleton>
        </div>
        <div className="space-y-4">
          <PanelSkeleton title="w-24">
            <SkeletonText className="text-sm" w="w-48" />
            <SkeletonText className="mt-2 text-sm font-semibold" w="w-36" />
            <SkeletonText className="mt-2 text-xs" w="w-40" />
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </PanelSkeleton>
          <PanelSkeleton title="w-20">
            <div className="grid gap-2">
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          </PanelSkeleton>
        </div>
      </div>
    </div>
  );
}

export function AdminMessagesSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-36" text="w-52" />
      <div className="space-y-3">
        {range(5).map((i) => (
          <div key={i} className={cn("p-4 sm:p-5", box)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <SkeletonText className="font-bold" w="w-40" />
                <SkeletonText className="mt-0.5 text-xs" w="w-28" />
              </div>
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <SkeletonText className="mt-3" lines={["w-full", "w-3/5"]} />
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              <Skeleton className="h-9 w-40 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-48 max-w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminNewsSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-28" text="w-20" action={<Skeleton className="h-11 w-44 rounded-xl" />} />
      <div className="mb-4 space-y-3">
        <PillsSkeleton widths={["w-14", "w-24", "w-32", "w-28"]} />
        <div className="flex flex-wrap gap-2">
          <Search />
          <Filter />
        </div>
      </div>
      <div className={cn("divide-y divide-border overflow-hidden", box)}>
        {range(8).map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 sm:p-4">
            <Skeleton className="h-16 w-24 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <SkeletonText className="text-xs" w="w-24" />
              </div>
              <SkeletonText className="mt-1 text-sm font-semibold" w={i % 2 ? "w-3/5" : "w-4/5"} />
              <SkeletonText className="mt-0.5 text-xs" w="w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewsFormSkeleton({ edit = false }: { edit?: boolean }) {
  return (
    <div aria-busy>
      <HeaderSkeleton back title="w-64 max-w-full" text={edit ? "w-44" : null} action={edit ? <Skeleton className="h-9 w-28 rounded-xl" /> : undefined} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className="space-y-4">
          <FormSection title="w-24">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                <FieldSkeleton label="w-16" />
                <FieldSkeleton label="w-24" />
              </div>
              <FieldSkeleton label="w-20" />
              <FieldSkeleton label="w-32" input="h-20" />
              <div className="overflow-hidden rounded-xl border border-border">
                <Skeleton className="h-11 rounded-none" />
                <div className="min-h-72 space-y-3 p-4">
                  <SkeletonText lines={["w-full", "w-11/12", "w-3/5"]} />
                  <SkeletonText lines={["w-full", "w-4/5"]} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldSkeleton label="w-24" />
                <FieldSkeleton label="w-32" />
              </div>
            </div>
          </FormSection>
          <FormSection title="w-44">
            <div className="space-y-4">
              <FieldSkeleton label="w-36" />
              <FieldSkeleton label="w-36" input="h-20" />
            </div>
          </FormSection>
        </div>
        <div className="space-y-4">
          <FormSection title="w-28">
            <div className="space-y-4">
              <SwitchRows rows={1} />
              <FieldSkeleton label="w-24" />
              <SwitchRows rows={1} />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          </FormSection>
          <FormSection title="w-40">
            <SkeletonText className="mb-3 text-xs" w="w-4/5" />
            <Skeleton className="h-11 rounded-xl" />
          </FormSection>
          <FormSection title="w-20">
            <Skeleton className="aspect-[16/10] rounded-xl" />
          </FormSection>
          <FormSection title="w-20">
            <div className="grid grid-cols-3 gap-2">
              {range(3).map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </FormSection>
        </div>
      </div>
    </div>
  );
}

export function AdminBannersSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-32" text="w-full max-w-xl" />
      <div className="mb-5 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="mb-4 flex justify-end">
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>
      <div className="space-y-3">
        {range(3).map((i) => (
          <div key={i} className={cn("overflow-hidden sm:flex", box)}>
            <Skeleton className="aspect-[5/4] shrink-0 rounded-none sm:w-48" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <SkeletonText className="mt-1 font-semibold" w="w-1/2" />
                </div>
                <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
              </div>
              <SkeletonText className="text-xs" w="w-48" />
              <div className="mt-auto flex items-center gap-1 border-t border-border pt-2">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
                <span className="flex-1" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCategoriesSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-36" text="w-52" action={<Skeleton className="h-11 w-48 rounded-xl" />} />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        {range(6).map((i) => (
          <div key={i} className={cn("overflow-hidden", box)}>
            <div className="flex items-center gap-3 p-4">
              <Skeleton className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <SkeletonText className="font-semibold" w="w-1/2" />
                <SkeletonText className="mt-0.5 text-xs" w="w-2/3" />
              </div>
              <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
              <Skeleton className="hidden h-9 w-[4.5rem] rounded-lg sm:block" />
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-dashed border-border py-2.5 pl-4 pr-2 sm:pl-6 sm:pr-3">
              <SkeletonText className="text-xs font-semibold" w="w-36" />
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-56 max-w-full" text="w-72 max-w-full" />
      <div className="space-y-5">
        <section className="skeleton-on-dark overflow-hidden rounded-2xl bg-ink">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Skeleton className="size-14 shrink-0 rounded-2xl" />
              <div className="min-w-0">
                <SkeletonText className="text-xs" w="w-24" />
                <SkeletonText className="mt-0.5 text-xl font-bold sm:text-2xl" w="w-56 max-w-full" />
                <SkeletonText className="mt-1 text-sm" lines={["w-96 max-w-full", "w-72 max-w-full"]} />
              </div>
            </div>
            <Skeleton className="h-9 w-32 shrink-0 self-start rounded-lg lg:self-center" />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 px-5 py-3.5 sm:px-6">
            {["w-36", "w-44", "w-28"].map((width) => (
              <SkeletonText key={width} className="text-sm" w={width} />
            ))}
          </div>
        </section>
        <div className="grid items-start gap-5 xl:grid-cols-2 [&>*]:min-w-0">
          <div className="space-y-5">
            <SettingsSectionSkeleton title="w-24" rows={3} edit />
            <SettingsSectionSkeleton title="w-24" rows={4} edit />
            <SettingsSectionSkeleton title="w-20" rows={1} edit />
          </div>
          <div className="space-y-5">
            <SettingsSectionSkeleton title="w-44" rows={6} edit />
            <SettingsSectionSkeleton title="w-24" rows={4} edit />
            <SettingsSectionSkeleton title="w-36" rows={3} edit />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminProfileSkeleton() {
  return (
    <div aria-busy>
      <HeaderSkeleton title="w-44" text="w-72 max-w-full" />
      <ProfileBandSkeleton />
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-2 [&>*]:min-w-0">
        <div className="space-y-5">
          <SettingsSectionSkeleton title="w-36" rows={2} edit />
          <SettingsSectionSkeleton title="w-28" rows={2} />
        </div>
        <div className="space-y-5">
          <SettingsSectionSkeleton title="w-32" rows={2} edit={false} />
          <SettingsSectionSkeleton title="w-28" rows={1} />
        </div>
      </div>
    </div>
  );
}

/** The inbox stands still and fills the panel, like widgets/chat/ui/StaffChats; on a phone an open conversation takes the screen. */
export function AdminChatsSkeleton({ open = false }: { open?: boolean }) {
  return (
    <div className="-m-3 grid h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] grid-rows-[minmax(0,1fr)] overflow-hidden bg-surface sm:-m-5 md:grid-cols-[340px_minmax(0,1fr)] lg:-m-8 lg:h-[calc(100dvh-4rem)]" aria-busy>
      <div className={cn("flex min-h-0 flex-col border-border md:border-r", open && "max-md:hidden")}>
        <div className="space-y-3 p-3 pb-2">
          <SkeletonText className="text-lg font-extrabold" w="w-44" />
          <Skeleton className="h-10 rounded-full" />
          <div className="flex gap-4 border-b border-border pb-2">
            {["w-10", "w-28", "w-10"].map((width, i) => (
              <SkeletonText key={i} className="flex-auto text-center text-[13px] font-semibold" w={width} />
            ))}
          </div>
        </div>
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-hidden p-2">
          <InboxRowsSkeleton rows={8} />
        </ul>
      </div>
      <div className={cn("min-h-0", open ? "max-md:fixed max-md:inset-0 max-md:z-40 max-md:bg-surface" : "chat-wall max-md:hidden")}>
        {open ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-2 sm:px-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonText className="font-bold" w="w-40" />
                <SkeletonText className="text-xs" w="w-28" />
              </div>
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="size-9 rounded-full" />
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
        ) : (
          <div className="grid h-full place-items-center p-6">
            <Skeleton className="h-8 w-56 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Which page's skeleton stands inside the shell on a first visit. */
function adminPage(browserPath: string) {
  const path = adminPath(browserPath).replace(/\/$/, "");
  const inside = (section: string) => path.startsWith(`/admin/${section}/`);
  const is = (section: string) => path === `/admin/${section}`;

  if (is("orders")) return <AdminOrdersSkeleton />;
  if (inside("orders")) return <AdminOrderSkeleton />;
  if (is("products")) return <AdminProductsSkeleton />;
  if (path === "/admin/products/new") return <ProductFormSkeleton />;
  if (inside("products")) return <ProductFormSkeleton edit />;
  if (is("users")) return <AdminUsersSkeleton />;
  if (inside("users")) return <AdminUserSkeleton />;
  if (is("news")) return <AdminNewsSkeleton />;
  if (path === "/admin/news/new") return <NewsFormSkeleton />;
  if (inside("news")) return <NewsFormSkeleton edit />;
  if (is("chats")) return <AdminChatsSkeleton />;
  if (inside("chats")) return <AdminChatsSkeleton open />;
  if (is("messages")) return <AdminMessagesSkeleton />;
  if (is("banners")) return <AdminBannersSkeleton />;
  if (is("categories")) return <AdminCategoriesSkeleton />;
  if (is("settings")) return <AdminSettingsSkeleton />;
  if (is("profile")) return <AdminProfileSkeleton />;

  return <DashboardSkeleton />;
}

/** The whole panel on a first visit, until the session is known: the dark menu with its groups, the top bar, the tabs on phones. */
export function AdminShellSkeleton({ path }: { path: string }) {
  return (
    <div className="admin-ui flex h-dvh bg-background" aria-busy>
      <div className="skeleton-on-dark hidden w-64 shrink-0 flex-col bg-ink lg:flex dark:border-r dark:border-white/10">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <LogoMark className="size-9 shrink-0" />
          <div className="min-w-0 flex-1 leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-white">BAKHT STROY</span>
            <SkeletonText className="text-[10.5px] font-semibold" w="w-24" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 overflow-hidden px-3 py-3 short:py-2">
          {[1, 3, 2, 2, 2].map((items, group) => (
            <div key={group}>
              <SkeletonText className="mb-1 px-3 text-[10.5px] font-semibold short:mb-0.5" w="w-16" />
              <div className="space-y-0.5">
                {range(items).map((i) => (
                  <div key={i} className="flex h-[clamp(1.75rem,calc((100dvh-20.5rem)/9),3rem)] items-center gap-3 rounded-lg px-3">
                    <Skeleton className="size-[18px] shrink-0 rounded" />
                    <SkeletonText className="min-w-0 flex-1 text-sm font-medium" w={i % 2 ? "w-3/5" : "w-2/5"} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-3 short:p-2">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2 short:p-1.5">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 leading-tight">
              <SkeletonText className="text-sm font-bold" w="w-3/4" />
              <SkeletonText className="text-xs" w="w-1/2" />
            </div>
            <Skeleton className="size-4 shrink-0 rounded" />
          </div>
          <Skeleton className="mt-2 h-9 rounded-lg short:mt-1 short:h-8" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface/80 px-3 backdrop-blur sm:gap-3 sm:px-5 lg:px-8">
          <Skeleton className="size-10 shrink-0 rounded-xl lg:hidden" />
          <Skeleton className="hidden h-10 max-w-md flex-1 rounded-lg md:block" />
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Skeleton className="h-10 w-14 rounded-xl sm:w-32" />
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-10 w-16 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-8">{adminPage(path)}</div>
        </div>
        <div className="shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="grid h-[calc(3.5rem-1px)] grid-cols-5">
            {range(5).map((i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-1">
                <Skeleton className="h-7 w-12 rounded-full" />
                <SkeletonText className="w-full text-center text-[10.5px] font-semibold" w="w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
