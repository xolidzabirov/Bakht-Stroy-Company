"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carousel state: current slide, auto-play every `duration` ms (paused on hover), swipe on touch screens.
 */
export function useSlider(count: number, duration: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((step: number) => setIndex((value) => (value + step + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;

    const timer = setTimeout(() => go(1), duration);

    return () => clearTimeout(timer);
  }, [count, duration, paused, index, go]);

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
