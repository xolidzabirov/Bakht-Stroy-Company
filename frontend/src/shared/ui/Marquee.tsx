import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { MarqueeArrows } from "./MarqueeArrows";

/**
 * A row that runs by itself without an end and stops under the mouse.
 * Two equal groups: when the first has gone, the second stands exactly in its place and the movement starts over unseen.
 * The movement is CSS only. For people who prefer less motion it stands still and scrolls by hand.
 *
 * children gets `copy`: the second group is a repeat, hidden from screen readers and from the Tab key.
 * `arrows` (their labels) adds arrows that appear by the mouse's side and move the row by a press;
 * `--marquee-arrow-top` in className sets their height.
 */
export function Marquee({
  seconds,
  className,
  arrows,
  children,
}: {
  seconds: number;
  className?: string;
  arrows?: { back: string; forward: string };
  children: (copy: boolean) => ReactNode;
}) {
  return (
    <div className={cn("marquee-shell", className)}>
      <div className="marquee" style={{ "--marquee-seconds": `${seconds}s` } as CSSProperties}>
        <div className="marquee-track">
          <ul className="marquee-group">{children(false)}</ul>
          <ul className="marquee-group" aria-hidden>
            {children(true)}
          </ul>
        </div>
      </div>
      {arrows && <MarqueeArrows back={arrows.back} forward={arrows.forward} />}
    </div>
  );
}
