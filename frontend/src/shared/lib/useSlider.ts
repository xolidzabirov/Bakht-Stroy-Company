"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carousel state: current slide, pause on hover, swipe on touch screens.
 * Auto-play is driven by the progress bar (SlideProgress `onComplete`): it pauses where it stopped
 * and continues from there, so the time left is never lost or restarted.
 * Off screen it also stands still: nothing to animate, and no photos to load for nobody.
 */
export function useSlider(count: number) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const go = useCallback((step: number) => setIndex((value) => (value + step + count) % count), [count]);

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
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

  return { index, setIndex, go, paused: hovered || !visible, visible, handlers, rootRef };
}
