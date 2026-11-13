"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GLIDE_MS = 700;
/** The mouse in the left or right third shows one arrow, in the middle both. */
const SIDE = 1 / 3;

/**
 * Arrows over a Marquee row, shown by where the mouse is: near the left edge the left one,
 * near the right edge the right one, in the middle both. A press glides the row by one item.
 * The row itself stays a CSS animation: a press only moves the time of that animation.
 */
export function MarqueeArrows({ back, forward }: { back: string; forward: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const glide = useRef<{ frame: number; goal: number } | null>(null);

  useEffect(() => {
    const shell = anchor.current?.closest<HTMLElement>(".marquee-shell");
    if (!shell) return;

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = shell.getBoundingClientRect();
      const at = (event.clientX - box.left) / box.width;
      shell.dataset.side = at < SIDE ? "left" : at > 1 - SIDE ? "right" : "center";
    };
    const leave = () => {
      delete shell.dataset.side;
    };

    shell.addEventListener("pointermove", move);
    shell.addEventListener("pointerleave", leave);
    return () => {
      shell.removeEventListener("pointermove", move);
      shell.removeEventListener("pointerleave", leave);
      if (glide.current) cancelAnimationFrame(glide.current.frame);
    };
  }, []);

  const slide = (direction: 1 | -1) => {
    const shell = anchor.current?.closest<HTMLElement>(".marquee-shell");
    const row = shell?.querySelector<HTMLElement>(".marquee");
    const track = shell?.querySelector<HTMLElement>(".marquee-track");
    if (!shell || !row || !track) return;

    // One item and the gap after it.
    const item = track.querySelector<HTMLElement>(".marquee-group > li");
    if (!item?.parentElement) return;
    const distance = item.offsetWidth + (parseFloat(getComputedStyle(item.parentElement).columnGap) || 0);
    const run = track.getAnimations()[0];
    const length = Number(run?.effect?.getComputedTiming().duration);

    // Less motion asked for: the row stands still and scrolls, so the press scrolls it.
    if (!run || !Number.isFinite(length) || length <= 0) {
      row.scrollBy({ left: direction * distance });
      return;
    }

    // One full run of the animation moves the row by half of the track (one of its two equal groups).
    const shift = direction * distance * (length / (track.scrollWidth / 2));
    const from = Number(run.currentTime ?? 0);
    const goal = (glide.current ? glide.current.goal : from) + shift;
    if (glide.current) cancelAnimationFrame(glide.current.frame);

    const started = performance.now();
    const step = (now: number) => {
      const part = Math.min(1, (now - started) / GLIDE_MS);
      // Soft start and soft stop: the row is pushed and settles, it does not jump.
      const eased = part < 0.5 ? 4 * part ** 3 : 1 - (-2 * part + 2) ** 3 / 2;
      const time = from + (goal - from) * eased;
      run.currentTime = ((time % length) + length) % length;
      glide.current = part < 1 ? { frame: requestAnimationFrame(step), goal } : null;
    };
    glide.current = { frame: requestAnimationFrame(step), goal };
  };

  return (
    <>
      <span ref={anchor} hidden />
      <button type="button" data-dir="back" aria-label={back} onClick={() => slide(-1)} className="marquee-arrow left-3 sm:left-6">
        <ChevronLeft className="size-5" />
      </button>
      <button type="button" data-dir="forward" aria-label={forward} onClick={() => slide(1)} className="marquee-arrow right-3 sm:right-6">
        <ChevronRight className="size-5" />
      </button>
    </>
  );
}
