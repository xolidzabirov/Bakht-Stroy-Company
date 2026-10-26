"use client";

import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";

type Props = {
  count: number;
  index: number;
  /** How long one slide is shown, ms — the active bar fills with white during this time. */
  duration: number;
  paused?: boolean;
  onSelect: (index: number) => void;
  className?: string;
};

/**
 * Equal bars over the picture; the current one fills with white while the slide is shown
 * (when it is full, the next slide comes). Click a bar to jump to its slide.
 */
export function SlideProgress({ count, index, duration, paused = false, onSelect, className }: Props) {
  const { t } = useI18n();

  if (count < 2) return null;

  return (
    <div className={cn("flex gap-2", className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={fmt(t.common.slide, { n: i + 1 })}
          aria-current={i === index}
          onClick={() => onSelect(i)}
          className="group/bar flex-1 py-2"
        >
          <span className="relative block h-1 overflow-hidden rounded-full bg-white/35 transition group-hover/bar:bg-white/55">
            {i === index && (
              <span
                // a new key restarts the fill for every slide
                key={`${index}-${paused}`}
                className="absolute inset-0 origin-left rounded-full bg-white motion-reduce:animate-none"
                style={{ animation: paused ? "none" : `slide-progress ${duration}ms linear forwards`, transform: paused ? "scaleX(1)" : undefined }}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
