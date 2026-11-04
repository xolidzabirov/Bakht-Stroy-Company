import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const arrow =
  "absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-foreground opacity-0 shadow-lg shadow-black/15 ring-1 ring-black/5 backdrop-blur transition duration-300 ease-out hover:scale-110 hover:bg-brand hover:text-on-brand focus-visible:opacity-100 active:scale-95 can-hover:grid group-hover/photo:translate-x-0 group-hover/photo:opacity-100";

/**
 * The arrows of a photo slider: they float in from the sides when the mouse is over the photo (class group/photo).
 * Touch screens have no hover: there the photos are swiped.
 */
export function SlideArrows({ onBack, onForward, backLabel, forwardLabel }: { onBack: () => void; onForward: () => void; backLabel: string; forwardLabel: string }) {
  return (
    <>
      <button type="button" onClick={onBack} aria-label={backLabel} className={cn(arrow, "left-2.5 -translate-x-2")}>
        <ChevronLeft className="size-5" />
      </button>
      <button type="button" onClick={onForward} aria-label={forwardLabel} className={cn(arrow, "right-2.5 translate-x-2")}>
        <ChevronRight className="size-5" />
      </button>
    </>
  );
}

/** How many photos there are and which one is shown: readable on any picture. */
export function SlideDots({ count, index, onSelect, label }: { count: number; index: number; onSelect: (index: number) => void; label: (n: number) => string }) {
  return (
    <div className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center">
      <div className="flex items-center rounded-full bg-black/40 px-1 backdrop-blur-sm">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} type="button" onClick={() => onSelect(i)} aria-label={label(i + 1)} aria-current={i === index} className="group/dot grid h-5 place-items-center px-[3px]">
            <span className={cn("block h-1.5 rounded-full transition-all duration-500 ease-out", i === index ? "w-4 bg-brand" : "w-1.5 bg-white/70 group-hover/dot:bg-white")} />
          </button>
        ))}
      </div>
    </div>
  );
}
