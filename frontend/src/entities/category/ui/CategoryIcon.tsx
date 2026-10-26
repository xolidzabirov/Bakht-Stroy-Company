import { BrickWall, DoorOpen, Grid3x3, Hammer, Package, PaintBucket, Refrigerator, ShowerHead, Tractor, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Icons of the store directions — the same set as the company Instagram highlights. */
const icons: Record<string, LucideIcon> = {
  asfalt: Tractor,
  "tsement-i-beton": Package,
  "kirpich-i-bloki": BrickWall,
  "okna-i-dveri": DoorOpen,
  santehnika: ShowerHead,
  "bytovaya-tehnika": Refrigerator,
  "lakokrasochnye-materialy": PaintBucket,
  armatura: Grid3x3,
  oborudovanie: Hammer,
};

const sizes = {
  sm: "size-9 p-2 ring-1",
  md: "size-14 p-3 ring-2",
  lg: "size-20 p-4 ring-[3px] sm:size-24 sm:p-5",
};

/**
 * Round black badge with a yellow ring and icon — the brand style of the Instagram highlights.
 */
export function CategoryIcon({ slug, size = "md", className }: { slug: string; size?: keyof typeof sizes; className?: string }) {
  const Icon = icons[slug] ?? Package;

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-ink text-brand ring-brand ring-offset-2 ring-offset-surface",
        sizes[size],
        className,
      )}
    >
      <Icon className="size-full" strokeWidth={1.75} />
    </span>
  );
}
