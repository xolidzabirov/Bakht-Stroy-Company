import { Star } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const sizes = { xs: "size-3.5", sm: "size-4", md: "size-5", lg: "size-6" };

/** A rating in stars: whole and partly filled, read out by screen readers from `label`. */
export function Stars({ value, size = "sm", label, className }: { value: number; size?: keyof typeof sizes; label: string; className?: string }) {
  return (
    <span role="img" aria-label={label} className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.min(1, Math.max(0, value - (n - 1)));

        return (
          <span key={n} aria-hidden className="relative inline-block">
            <Star className={cn(sizes[size], "fill-current text-border")} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn(sizes[size], "max-w-none fill-brand text-brand")} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
