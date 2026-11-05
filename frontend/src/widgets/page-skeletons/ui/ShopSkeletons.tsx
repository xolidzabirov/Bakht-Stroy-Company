import { cn } from "@/shared/lib/cn";
import { Container } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { BreadcrumbsSkeleton, FieldSkeleton, NewsCardSkeleton, ProductGridSkeleton, range, SectionHeadingSkeleton, SkeletonText } from "@/shared/ui/PageSkeletons";

/**
 * The pages of the shop while they load. Each one repeats its page block by block: the same grids, cards,
 * paddings and colored panels, so the real content simply takes the place of the placeholders.
 */

const card = "rounded-[var(--radius-card)] border border-border bg-surface";
const pageTitle = "text-3xl font-extrabold sm:text-4xl";

/** The yellow "call us" block most pages end with, like widgets/contact-cta. */
function ContactCtaSkeleton() {
  return (
    <Container className="mt-20 sm:mt-28">
      <div className="skeleton-on-brand relative overflow-hidden rounded-[2rem] bg-brand px-6 py-10 sm:px-12 sm:py-14">
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SkeletonText className="text-3xl font-extrabold sm:text-4xl" w="w-4/5" />
            <SkeletonText className="mt-3 max-w-xl text-base" lines={["w-full", "w-2/3"]} />
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Skeleton className="h-12 w-44 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </Container>
  );
}

/** The grid of categories, like widgets/category-grid. */
function CategoryGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <Container className="mt-20 sm:mt-28">
      <SectionHeadingSkeleton />
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {range(count).map((i) => (
          <div key={i} className={cn("flex items-stretch overflow-hidden", card)}>
            <Skeleton className="w-28 shrink-0 rounded-none sm:w-36" />
            <div className="flex min-h-28 min-w-0 flex-1 items-center justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <SkeletonText className="font-display text-base font-bold sm:text-lg" w="w-3/4" />
                <SkeletonText className="mt-1 text-sm" w="w-16" />
              </div>
              <Skeleton className="size-5 shrink-0 rounded" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}

/** Four advantages under a thin line, like widgets/advantages. */
function AdvantagesSkeleton() {
  return (
    <Container className="mt-16 sm:mt-20">
      <div className="grid gap-x-8 gap-y-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {range(4).map((i) => (
          <div key={i}>
            <Skeleton className="size-6 rounded-md" />
            <SkeletonText className="mt-4 font-display text-lg font-bold" w="w-2/3" />
            <SkeletonText className="mt-1.5 text-sm" lines={["w-full", "w-4/5"]} />
          </div>
        ))}
      </div>
    </Container>
  );
}

function ProductSectionSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Container className="mt-20 sm:mt-28">
      <SectionHeadingSkeleton />
      <ProductGridSkeleton count={count} />
    </Container>
  );
}

/** Home: the dark first screen with the slider and figures, categories, advantages, products, news, the yellow block. */
export function HomeSkeleton() {
  return (
    <div aria-busy>
      <section className="skeleton-on-dark relative overflow-hidden bg-ink">
        <Container className="relative grid items-center gap-10 pt-10 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-16">
          <div>
            <Skeleton className="h-[26px] w-48 rounded-full" />
            <SkeletonText className="mt-5 text-4xl font-extrabold sm:text-5xl xl:text-6xl" lines={["w-11/12", "w-3/4"]} />
            <SkeletonText className="mt-5 max-w-xl text-base sm:text-lg" lines={["w-full", "w-11/12", "w-full", "w-2/3"]} />
            <div className="mt-8 flex flex-wrap gap-3">
              <Skeleton className="h-13 w-52 rounded-xl" />
              <Skeleton className="h-13 w-48 rounded-xl" />
            </div>
            <SkeletonText className="mt-8 text-sm" w="w-64" />
          </div>
          <Skeleton className="aspect-[4/3] rounded-[2rem] lg:aspect-[5/4]" />
        </Container>
        <Container className="relative">
          <div className="mt-10 grid grid-cols-2 gap-x-6 border-t border-white/10 md:mt-14 md:grid-cols-4 md:gap-x-0">
            {range(4).map((i) => (
              <div key={i} className="py-6 md:border-l md:border-white/10 md:px-8 md:py-8 md:first:border-l-0 md:first:pl-0">
                <SkeletonText className="font-display text-3xl font-extrabold md:text-4xl" w="w-20" />
                <SkeletonText className="mt-1 text-sm" w="w-28" />
              </div>
            ))}
          </div>
        </Container>
      </section>
      <Container className="mt-8">
        <Skeleton className="aspect-[16/7] rounded-[var(--radius-card)] sm:aspect-[16/5]" />
      </Container>
      <div className="mt-10 overflow-hidden py-2">
        <ul className="flex min-w-[100vw] justify-around gap-5 sm:gap-7">
          {range(12).map((i) => (
            <li key={i} className="flex w-24 shrink-0 flex-col items-center gap-3 sm:w-32">
              <Skeleton className="size-20 rounded-full sm:size-24" />
              <SkeletonText className="w-full text-center text-xs font-semibold sm:text-sm" w="w-16" />
            </li>
          ))}
        </ul>
      </div>
      <AdvantagesSkeleton />
      <CategoryGridSkeleton />
      <ProductSectionSkeleton />
      <section className="mt-20 sm:mt-28">
        <Container>
          <SectionHeadingSkeleton title="w-52" />
        </Container>
        <div className="overflow-hidden">
          <ul className="flex min-w-[100vw] justify-around gap-3 sm:gap-5">
            {range(6).map((i) => (
              <li key={i} className="shrink-0">
                <Skeleton className="aspect-[3/2] w-64 rounded-2xl sm:w-96" />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Container className="mt-20 sm:mt-28">
        <SectionHeadingSkeleton />
        <div className="grid gap-4 md:grid-cols-3">
          {range(3).map((i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      </Container>
      <ContactCtaSkeleton />
    </div>
  );
}

/** Catalog: categories and filters on the left (a row of chips on phones), sorting and cards on the right. */
export function CatalogSkeleton({ withIcon = false }: { withIcon?: boolean }) {
  return (
    <Container className="py-8">
      <BreadcrumbsSkeleton w="w-40" />
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {withIcon && <Skeleton className="size-14 shrink-0 rounded-full" />}
          <div>
            <SkeletonText className={pageTitle} w="w-56" />
            <SkeletonText className="mt-1 text-sm" w="w-24" />
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <div className="-mx-4 flex gap-2 overflow-hidden px-4 pb-1 lg:mx-0 lg:block lg:space-y-1 lg:px-0">
            {range(11).map((i) => (
              <div key={i} className="flex shrink-0 items-center gap-3 rounded-xl border border-border px-3 py-2 lg:border-transparent">
                <Skeleton className="hidden size-9 shrink-0 rounded-full lg:block" />
                <SkeletonText className="w-20 text-sm font-semibold lg:w-auto lg:flex-1" w={i % 2 ? "w-full lg:w-3/4" : "w-full lg:w-1/2"} />
                <Skeleton className="hidden h-3 w-5 lg:block" />
              </div>
            ))}
          </div>
          <div className={cn("hidden space-y-6 p-5 lg:block", card)}>
            <div>
              <SkeletonText className="text-sm font-semibold" w="w-14" />
              <Skeleton className="mt-2 h-11 rounded-xl" />
            </div>
            <div>
              <SkeletonText className="text-sm font-semibold" w="w-24" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-3">
              {["w-24", "w-28"].map((width) => (
                <div key={width} className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded-md" />
                  <SkeletonText className="text-sm" w={width} />
                </div>
              ))}
            </div>
          </div>
          <div className={cn("lg:hidden", card)}>
            <div className="flex items-center gap-2 p-4">
              <Skeleton className="size-4 rounded" />
              <SkeletonText className="font-semibold" w="w-20" />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <SkeletonText className="text-sm" w="w-28" />
            <div className="flex items-center gap-2">
              <SkeletonText className="hidden text-sm sm:block" w="w-20" />
              <Skeleton className="h-10 w-48 rounded-xl" />
            </div>
          </div>
          <ProductGridSkeleton count={12} className="md:grid-cols-3 lg:grid-cols-3" />
        </div>
      </div>
    </Container>
  );
}

/** Product page: the gallery with its squares, name, price, buttons, specs and description, similar products. */
export function ProductSkeleton() {
  return (
    <div aria-busy>
      <Container className="py-8">
        <BreadcrumbsSkeleton w="w-72 max-w-full" />
        <div className="mt-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 [&>*]:min-w-0">
            <div>
              <Skeleton className="aspect-square rounded-[var(--radius-card)]" />
              <div className="mt-3 grid grid-cols-5 gap-2">
                {range(5).map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            </div>
            <div>
              <SkeletonText className="text-sm font-semibold" w="w-28" />
              <SkeletonText className="mt-2 text-2xl font-extrabold sm:text-3xl" lines={["w-full", "w-2/3"]} />
              <SkeletonText className="mt-2 text-sm" w="w-40" />
              <SkeletonText className="mt-2 text-sm" w="w-44" />
              <div className={cn("mt-6 p-5 sm:p-6", card)}>
                <SkeletonText className="font-display text-4xl font-extrabold" w="w-40" />
                <div className="mt-4 space-y-1.5">
                  {["w-48", "w-40", "w-52"].map((width) => (
                    <SkeletonText key={width} className="text-sm" w={width} />
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Skeleton className="h-[42px] w-[138px] rounded-xl" />
                  <Skeleton className="h-13 min-w-48 flex-1 rounded-xl" />
                </div>
                <Skeleton className="mt-3 h-13 rounded-xl" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Skeleton className="h-11 w-40 rounded-full" />
                  <Skeleton className="h-11 w-32 rounded-full" />
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {range(2).map((i) => (
                  <div key={i} className="flex gap-3 rounded-2xl bg-surface-muted p-4">
                    <Skeleton className="size-5 shrink-0 rounded" />
                    <SkeletonText className="min-w-0 flex-1 text-sm" lines={["w-full", "w-full", "w-2/3"]} />
                  </div>
                ))}
              </div>
              <SkeletonText className="mt-4 text-sm font-semibold" w="w-44" />
            </div>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr] [&>*]:min-w-0">
            <div>
              <SkeletonText className="text-xl font-extrabold" w="w-44" />
              <div className={cn("mt-4 divide-y divide-border", card)}>
                {range(5).map((i) => (
                  <div key={i} className="flex justify-between gap-4 px-5 py-3 text-sm">
                    <SkeletonText className="flex-1" w="w-24" />
                    <SkeletonText className="flex-1 text-right font-semibold" w="w-20" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SkeletonText className="text-xl font-extrabold" w="w-32" />
              <SkeletonText className="mt-4" lines={["w-full", "w-11/12", "w-full", "w-3/5"]} />
            </div>
          </div>
        </div>
        <div className="mt-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SkeletonText className="text-xl font-extrabold" w="w-32" />
            <Skeleton className="h-11 w-44 rounded-xl" />
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className={cn("p-5 sm:p-6", card)}>
              <div className="flex items-center gap-4">
                <SkeletonText className="font-display text-5xl font-extrabold" w="w-20" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-28" />
                  <SkeletonText className="mt-1 text-sm" w="w-20" />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {["w-3/4", "w-1/3", "w-1/6", "w-1/12", "w-1/6"].map((width, i) => (
                  <div key={i} className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center gap-2 text-sm">
                    <SkeletonText w="w-5" />
                    <Skeleton className={cn("h-2 rounded-full", width)} />
                    <SkeletonText className="text-right text-xs" w="w-4" />
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-0 space-y-3">
              {range(3).map((i) => (
                <div key={i} className={cn("p-4 sm:p-5", card)}>
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <SkeletonText className="text-sm font-bold" w="w-28" />
                      <SkeletonText className="mt-0.5 text-xs" w="w-44" />
                    </div>
                  </div>
                  <SkeletonText className="mt-3 text-[15px] leading-relaxed" lines={i % 2 ? ["w-full", "w-3/5"] : ["w-full", "w-11/12", "w-2/5"]} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
      <ProductSectionSkeleton count={4} />
    </div>
  );
}

/** Cart: the lines on the left, the total on the right. */
export function CartSkeleton() {
  return (
    <Container className="py-8">
      <BreadcrumbsSkeleton w="w-32" />
      <SkeletonText className={cn("mt-5", pageTitle)} w="w-44" />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px] [&>*]:min-w-0">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <SkeletonText className="text-sm" w="w-28" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
          <div className={cn("divide-y divide-border", card)}>
            {range(3).map((i) => (
              <div key={i} className="flex gap-4 p-4 sm:p-5">
                <Skeleton className="size-20 shrink-0 rounded-xl sm:size-24" />
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <SkeletonText className="text-xs" w="w-20" />
                    <SkeletonText className="font-semibold" w="w-3/4" />
                    <SkeletonText className="mt-1 text-sm" w="w-24" />
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <Skeleton className="h-[34px] w-[106px] rounded-xl" />
                    <SkeletonText className="w-28 text-right font-display text-lg font-extrabold" w="w-20" />
                    <Skeleton className="size-9 shrink-0 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={card}>
          <div className="px-6 pt-6">
            <SkeletonText className="text-xl font-extrabold" w="w-32" />
          </div>
          <div className="space-y-3 px-6 pb-6 pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <SkeletonText className="flex-1" w="w-24" />
              <SkeletonText className="flex-1 text-right font-semibold" w="w-20" />
            </div>
            <div className="flex justify-between gap-4">
              <SkeletonText className="flex-1" w="w-20" />
              <SkeletonText className="flex-1 text-right font-semibold" w="w-16" />
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-baseline justify-between gap-4">
              <SkeletonText className="font-semibold" w="w-16" />
              <SkeletonText className="font-display text-2xl font-extrabold" w="w-32" />
            </div>
            <SkeletonText className="text-xs" lines={["w-full", "w-3/4"]} />
            <Skeleton className="h-13 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <SkeletonText className="pt-1 text-xs" lines={["w-full", "w-2/3"]} />
          </div>
        </div>
      </div>
    </Container>
  );
}

function CheckoutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn("p-5 sm:p-6", card)}>
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <SkeletonText className="min-w-0 flex-1 text-lg font-extrabold" w={title} />
      </div>
      {children}
    </div>
  );
}

function ChoiceSkeleton({ vertical = false }: { vertical?: boolean }) {
  return (
    <div className={cn("flex gap-3 rounded-2xl border border-border p-4", vertical && "flex-col")}>
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <SkeletonText className="font-bold" w="w-28" />
        <SkeletonText className="mt-0.5 text-sm leading-snug" lines={["w-full", "w-3/4"]} />
      </div>
    </div>
  );
}

/** Checkout: four numbered sections on the left, the order on the right. */
export function CheckoutSkeleton() {
  return (
    <Container className="py-8">
      <BreadcrumbsSkeleton w="w-56" />
      <SkeletonText className={cn("mt-5", pageTitle)} w="w-72 max-w-full" />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_400px] [&>*]:min-w-0">
        <div className="space-y-5">
          <CheckoutSection title="w-28">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton label="w-32" />
              <div>
                <FieldSkeleton label="w-36" />
                <SkeletonText className="mt-1.5 text-xs" lines={["w-full", "w-1/2"]} />
              </div>
            </div>
          </CheckoutSection>
          <CheckoutSection title="w-28">
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceSkeleton />
              <ChoiceSkeleton />
            </div>
            <div className="mt-5 grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-6">
              <FieldSkeleton className="sm:col-span-2" label="w-24" />
              <FieldSkeleton className="sm:col-span-4" label="w-16" />
              <FieldSkeleton className="sm:col-span-3" label="w-12" />
              <FieldSkeleton className="sm:col-span-3" label="w-20" />
              <FieldSkeleton className="sm:col-span-6" label="w-28" />
            </div>
          </CheckoutSection>
          <CheckoutSection title="w-44">
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceSkeleton vertical />
              <ChoiceSkeleton vertical />
            </div>
          </CheckoutSection>
          <CheckoutSection title="w-48">
            <Skeleton className="h-24 rounded-xl" />
          </CheckoutSection>
        </div>
        <div className="space-y-4">
          <div className={card}>
            <div className="px-6 pt-6">
              <SkeletonText className="text-xl font-extrabold" w="w-28" />
            </div>
            <div className="space-y-4 px-6 pb-6 pt-4">
              <div className="space-y-3">
                {range(3).map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <SkeletonText className="text-sm font-medium" w="w-4/5" />
                      <SkeletonText className="text-xs" w="w-20" />
                    </div>
                    <SkeletonText className="text-sm font-semibold" w="w-16" />
                  </div>
                ))}
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <SkeletonText className="flex-1" w="w-20" />
                  <SkeletonText className="flex-1 text-right font-semibold" w="w-16" />
                </div>
                <div className="flex justify-between gap-4">
                  <SkeletonText className="flex-1" w="w-20" />
                  <SkeletonText className="flex-1 text-right font-semibold" w="w-14" />
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-baseline justify-between gap-4">
                <SkeletonText className="font-semibold" w="w-14" />
                <SkeletonText className="font-display text-2xl font-extrabold" w="w-28" />
              </div>
              <SkeletonText className="text-xs" lines={["w-full", "w-3/4"]} />
              <Skeleton className="h-13 rounded-xl" />
              <SkeletonText className="text-center text-xs" lines={["w-full", "w-3/4"]} />
            </div>
          </div>
          <div className={cn("p-5", card)}>
            <SkeletonText className="font-bold" w="w-32" />
            <div className="mt-3 space-y-3">
              {range(4).map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-6 shrink-0 rounded-full" />
                  <SkeletonText className="min-w-0 flex-1 text-sm" lines={i % 2 ? ["w-3/4"] : ["w-full", "w-1/2"]} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

/** "The order is placed": the check mark, the figures, what to do next, the four steps. */
export function OrderPlacedSkeleton() {
  return (
    <Container className="max-w-3xl py-10 lg:w-full lg:max-w-3xl">
      <div className="flex flex-col items-center text-center">
        <Skeleton className="size-16 rounded-full" />
        <SkeletonText className="mt-4 w-full text-3xl font-extrabold sm:text-4xl" w="w-72 max-w-full" />
        <SkeletonText className="mt-3 w-full max-w-xl" lines={["w-full", "w-3/4"]} />
      </div>
      <div className={cn("mt-8 grid gap-3 p-6 sm:grid-cols-3", card)}>
        {range(3).map((i) => (
          <div key={i}>
            <SkeletonText className="text-xs" w="w-20" />
            <SkeletonText className="font-display text-2xl font-extrabold" w="w-32" />
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-[var(--radius-card)] border-2 border-border bg-surface p-6">
        <SkeletonText className="text-lg font-extrabold" w="w-56" />
        <SkeletonText className="mt-2" lines={["w-full", "w-4/5"]} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-11 w-36 rounded-xl" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {range(4).map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4">
            <Skeleton className="size-7 rounded-full" />
            <SkeletonText className="mt-2 text-sm" lines={["w-full", "w-full", "w-2/3"]} />
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Skeleton className="h-11 w-44 rounded-xl" />
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>
    </Container>
  );
}

export function FavoritesSkeleton() {
  return (
    <Container className="py-8">
      <BreadcrumbsSkeleton w="w-36" />
      <SkeletonText className={cn("mt-5", pageTitle)} w="w-52" />
      <SkeletonText className="mt-1 text-sm" w="w-24" />
      <ProductGridSkeleton className="mt-6" />
    </Container>
  );
}

export function NewsListSkeleton() {
  return (
    <Container className="py-8">
      <BreadcrumbsSkeleton w="w-44" />
      <div className="mt-6">
        <SkeletonText className={pageTitle} w="w-64" />
        <SkeletonText className="mt-2" w="w-96 max-w-full" />
        <div className="mt-6 flex flex-wrap gap-2">
          {["w-20", "w-24", "w-36", "w-44", "w-28"].map((width) => (
            <Skeleton key={width} className={cn("h-10 shrink-0 rounded-full", width)} />
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {range(6).map((i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}

/** A post: meta line, title, cover, paragraphs. */
export function ArticleSkeleton() {
  return (
    <div aria-busy>
      <Container className="py-8">
        <BreadcrumbsSkeleton w="w-72 max-w-full" />
        <div className="mx-auto mt-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <SkeletonText className="text-sm" w="w-28" />
            <SkeletonText className="text-sm" w="w-12" />
          </div>
          <SkeletonText className="mt-4 text-3xl font-extrabold sm:text-4xl" lines={["w-full", "w-2/3"]} />
          <Skeleton className="mt-6 aspect-[16/9] rounded-[var(--radius-card)]" />
          <div className="mt-6 space-y-5">
            <SkeletonText lines={["w-full", "w-11/12", "w-full", "w-2/3"]} />
            <SkeletonText lines={["w-full", "w-full", "w-4/5"]} />
            <SkeletonText lines={["w-11/12", "w-full", "w-1/2"]} />
          </div>
        </div>
      </Container>
    </div>
  );
}

/** About: the dark first block, figures, categories, values, advantages, where we are, the yellow block. */
export function AboutSkeleton() {
  return (
    <div aria-busy>
      <Container className="py-8">
        <BreadcrumbsSkeleton w="w-36" />
        <section className="skeleton-on-dark relative mt-6 overflow-hidden rounded-[2rem] bg-ink px-6 py-10 sm:px-12 sm:py-14">
          <div className="relative max-w-3xl">
            <SkeletonText className="text-sm font-semibold" w="w-40" />
            <SkeletonText className="mt-3 text-3xl font-extrabold sm:text-5xl" w="w-2/5" />
            <SkeletonText className="mt-5 text-base sm:text-lg" lines={["w-full", "w-11/12", "w-full", "w-2/5"]} />
            <div className="mt-8 flex flex-wrap gap-3">
              <Skeleton className="h-13 w-44 rounded-xl" />
              <Skeleton className="h-13 w-44 rounded-xl" />
            </div>
          </div>
        </section>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {range(4).map((i) => (
            <div key={i} className={cn("p-5", card)}>
              <SkeletonText className="font-display text-3xl font-extrabold sm:text-4xl" w="w-20" />
              <SkeletonText className="mt-1 text-sm" w="w-28" />
            </div>
          ))}
        </div>
      </Container>
      <CategoryGridSkeleton count={6} />
      <Container className="mt-16">
        <SectionHeadingSkeleton />
        <div className="grid gap-4 md:grid-cols-3">
          {range(3).map((i) => (
            <div key={i} className="rounded-[var(--radius-card)] border border-border p-6">
              <Skeleton className="size-12 rounded-2xl" />
              <SkeletonText className="mt-4 font-display text-lg font-bold" w="w-2/3" />
              <SkeletonText className="mt-2 text-sm" lines={["w-full", "w-full", "w-3/5"]} />
            </div>
          ))}
        </div>
      </Container>
      <AdvantagesSkeleton />
      <ContactCtaSkeleton />
    </div>
  );
}

/** Contacts: phones on a dark card, address and hours, the form, the map. */
export function ContactsSkeleton() {
  return (
    <Container className="py-8">
      <BreadcrumbsSkeleton w="w-36" />
      <div className="mt-6 max-w-3xl">
        <SkeletonText className={pageTitle} w="w-44" />
        <SkeletonText className="mt-3 text-lg" lines={["w-full", "w-2/3"]} />
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.15fr] [&>*]:min-w-0">
        <div className="grid gap-4">
          <section className="skeleton-on-dark rounded-[var(--radius-card)] bg-ink p-6 sm:p-8">
            <SkeletonText className="text-sm font-bold" w="w-24" />
            <div className="mt-4 space-y-2">
              {range(3).map((i) => (
                <SkeletonText key={i} className="font-display text-xl font-extrabold sm:text-3xl" w="w-64 max-w-full" />
              ))}
            </div>
            <SkeletonText className="mt-8 text-sm font-bold" w="w-28" />
            <div className="mt-3 flex flex-wrap gap-2">
              {["w-52", "w-44", "w-28", "w-24", "w-24", "w-24"].map((width, i) => (
                <Skeleton key={i} className={cn("h-10 max-w-full rounded-xl", width)} />
              ))}
            </div>
          </section>
          <section className={cn("space-y-5 p-6 sm:p-8", card)}>
            {range(3).map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="mt-0.5 size-5 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <SkeletonText className="text-xs font-bold" w="w-16" />
                  <SkeletonText className="mt-1 text-base font-semibold" w={i ? "w-48" : "w-56"} />
                </div>
              </div>
            ))}
          </section>
        </div>
        <section className={cn("p-6 sm:p-8", card)}>
          <SkeletonText className="text-2xl font-extrabold" w="w-44" />
          <SkeletonText className="mb-6 mt-2 text-sm" w="w-4/5" />
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton label="w-20" />
              <FieldSkeleton label="w-24" />
            </div>
            <FieldSkeleton label="w-16" />
            <FieldSkeleton label="w-28" input="h-32" />
            <Skeleton className="h-11 w-36 rounded-xl" />
            <SkeletonText className="text-xs" w="w-4/5" />
          </div>
        </section>
      </div>
      <Skeleton className="mt-4 h-[420px] rounded-[var(--radius-card)] sm:h-[560px]" />
    </Container>
  );
}

/** Delivery: the two ways of receiving, the zones, the steps, the yellow block. */
export function DeliverySkeleton() {
  return (
    <div aria-busy>
      <Container className="py-8">
        <BreadcrumbsSkeleton w="w-40" />
        <div className="mt-6 max-w-3xl">
          <SkeletonText className={pageTitle} w="w-64" />
          <SkeletonText className="mt-3 text-lg" lines={["w-full", "w-3/4"]} />
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
          <section className={cn("p-6 sm:p-8", card)}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 shrink-0 rounded-2xl" />
              <SkeletonText className="flex-1 text-2xl font-extrabold" w="w-40" />
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <SkeletonText className="text-sm" w="w-24" />
                <SkeletonText className="mt-1 text-xl font-extrabold" w="w-28" />
              </div>
              <div>
                <SkeletonText className="text-sm" w="w-20" />
                <SkeletonText className="mt-1 font-semibold" w="w-44" />
              </div>
              <div className="sm:col-span-2">
                <SkeletonText className="text-sm" w="w-24" />
                <SkeletonText className="mt-1" lines={["w-full", "w-3/5"]} />
              </div>
            </div>
            <Skeleton className="mt-5 h-20 rounded-xl" />
          </section>
          <section className="skeleton-on-dark flex flex-col rounded-[var(--radius-card)] bg-ink p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 shrink-0 rounded-2xl" />
              <SkeletonText className="flex-1 text-2xl font-extrabold" w="w-36" />
            </div>
            <SkeletonText className="mt-4" lines={["w-full", "w-3/4"]} />
            <div className="mt-5 space-y-3">
              {range(2).map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="mt-0.5 size-5 shrink-0 rounded" />
                  <SkeletonText className="min-w-0 flex-1 text-sm" w="w-3/4" />
                </div>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <Skeleton className="h-11 w-44 rounded-xl" />
            </div>
          </section>
        </div>
        <div className="mt-12">
          <SkeletonText className="text-2xl font-extrabold sm:text-3xl" w="w-64" />
          <SkeletonText className="mt-2" w="w-96 max-w-full" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {range(2).map((i) => (
              <div key={i} className={cn("p-5", card)}>
                <Skeleton className="size-11 rounded-2xl" />
                <SkeletonText className="mt-4 font-display text-base font-bold" w="w-40" />
                <SkeletonText className="mt-1.5 text-sm" lines={["w-full", "w-2/3"]} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          {range(2).map((block) => (
            <section key={block} className={cn("p-6 sm:p-8", card)}>
              <SkeletonText className="text-2xl font-extrabold" w="w-44" />
              <div className="mt-6 space-y-5">
                {range(4).map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <SkeletonText className="min-w-0 flex-1 pt-1.5" lines={["w-full", "w-2/3"]} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
      <ContactCtaSkeleton />
    </div>
  );
}
