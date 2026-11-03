"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The soft sideways move of both carousels. */
export const SLIDE_MOVE = "transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/**
 * Carousel state: current slide, pause on hover, swipe on touch screens.
 * Auto-play is driven by the progress bar (SlideProgress `onComplete`): it pauses where it stopped
 * and continues from there, so the time left is never lost or restarted.
 * Off screen it also stands still: nothing to animate, and no photos to load for nobody.
 *
 * The strip has no ends: every change is one step in its direction. The strip moves one place, the new slide waits
 * in that place and the old one stays behind it, so after the last slide the first one comes from the same side.
 */
export function useSlider(count: number) {
  const [{ index, previous, step, direction }, setState] = useState({ index: 0, previous: 0, step: 0, direction: 1 });
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  // Photos that may load: the current one and, a little later, its neighbours on both sides.
  const [loaded, setLoaded] = useState<number[]>([0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || count < 2) return;
    const timer = setTimeout(() => setLoaded((list) => [...new Set([...list, (index + 1) % count, (index - 1 + count) % count])]), 2500);
    return () => clearTimeout(timer);
  }, [index, visible, count]);

  const moveTo = useCallback(
    (target: number, towards: number) => {
      setState((state) => (target === state.index ? state : { index: target, previous: state.index, step: state.step + towards, direction: towards }));
      setLoaded((list) => (list.includes(target) ? list : [...list, target]));
    },
    [],
  );

  const go = useCallback(
    (towards: 1 | -1) => {
      if (count > 1) moveTo((index + towards + count) % count, towards);
    },
    [count, index, moveTo],
  );

  /** A bar under the slider: forwards or backwards depending on where it is. */
  const setIndex = useCallback((target: number) => moveTo(target, target > index ? 1 : -1), [index, moveTo]);

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

  /** The strip that moves. */
  const stripStyle = { transform: `translateX(${-step * 100}%)` };

  /** A slide on the strip: only the current one and the one it replaces are there at all. */
  const slideStyle = (i: number): React.CSSProperties => {
    if (i === index) return { transform: `translateX(${step * 100}%)` };
    if (i === previous) return { transform: `translateX(${(step - direction) * 100}%)` };

    return { visibility: "hidden" };
  };

  return { index, setIndex, go, paused: hovered || !visible, handlers, rootRef, stripStyle, slideStyle, shouldLoad: (i: number) => loaded.includes(i) };
}
