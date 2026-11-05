import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * A row that runs by itself without an end and stops under the mouse.
 * Two equal groups: when the first has gone, the second stands exactly in its place and the movement starts over unseen.
 * No script, so a long page does not pay for it. For people who prefer less motion it stands still and scrolls by hand.
 *
 * children gets `copy`: the second group is a repeat, hidden from screen readers and from the Tab key.
 */
export function Marquee({ seconds, className, children }: { seconds: number; className?: string; children: (copy: boolean) => ReactNode }) {
  return (
    <div className={cn("marquee", className)} style={{ "--marquee-seconds": `${seconds}s` } as CSSProperties}>
      <div className="marquee-track">
        <ul className="marquee-group">{children(false)}</ul>
        <ul className="marquee-group" aria-hidden>
          {children(true)}
        </ul>
      </div>
    </div>
  );
}
