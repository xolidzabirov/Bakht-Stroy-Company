"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Carousel state: current slide, pause on hover, swipe on touch screens.
 * Auto-play is driven by the progress bar (SlideProgress `onComplete`): it pauses where it stopped
 * and continues from there, so the time left is never lost or restarted.
 */
export function useSlider(count: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((step: number) => setIndex((value) => (value + step + count) % count), [count]);

  const handlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onTouchStart: (event: React.TouchEvent) => {
      touchX.current = event.touches[0].clientX;
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (touchX.current === null) return;
      const delta = event.changedTouches[0].clientX - touchX.current;
      if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
      touchX.current = null;
    },
  };

  return { index, setIndex, go, paused, handlers };
}
