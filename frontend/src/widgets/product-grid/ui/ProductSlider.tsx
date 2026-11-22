"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
};

const SIDE = 0.35;

/**
 * Product slider with side-aware arrows:
 * - When moving the mouse closer to the left side, the left arrow appears.
 * - When closer to the right, the right arrow appears.
 * - In the center, both arrows appear.
 * - Arrows at the boundary (e.g. at the very start) hide automatically.
 * - Does NOT auto-scroll (manual / button scroll only).
 */
export function ProductSlider({ children, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [mouseSide, setMouseSide] = useState<"left" | "right" | "center" | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollBounds = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollBounds();
    el.addEventListener("scroll", updateScrollBounds, { passive: true });
    window.addEventListener("resize", updateScrollBounds);

    return () => {
      el.removeEventListener("scroll", updateScrollBounds);
      window.removeEventListener("resize", updateScrollBounds);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const at = (e.clientX - rect.left) / rect.width;
    setMouseSide(at < SIDE ? "left" : at > 1 - SIDE ? "right" : "center");
  };

  const handlePointerLeave = () => {
    setMouseSide(null);
  };

  const slide = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;

    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 300;
    const distance = cardWidth * (window.innerWidth < 640 ? 1 : 2);

    el.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  const showLeft = canScrollLeft && (mouseSide === "left" || mouseSide === "center");
  const showRight = canScrollRight && (mouseSide === "right" || mouseSide === "center");

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("group relative", className)}
    >
      {/* Left button */}
      <button
        type="button"
        aria-label="Назад"
        onClick={() => slide(-1)}
        className={cn(
          "absolute left-2 sm:left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-foreground shadow-xl transition-all duration-200 hover:bg-brand hover:border-brand hover:text-black hover:scale-110 active:scale-95",
          showLeft ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-85",
        )}
      >
        <ChevronLeft className="size-6" />
      </button>

      {/* Scroll track */}
      <div
        ref={scrollRef}
        className="flex flex-nowrap overflow-x-auto scroll-smooth snap-x snap-mandatory gap-3 sm:gap-4 py-3 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Right button */}
      <button
        type="button"
        aria-label="Вперёд"
        onClick={() => slide(1)}
        className={cn(
          "absolute right-2 sm:right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-foreground shadow-xl transition-all duration-200 hover:bg-brand hover:border-brand hover:text-black hover:scale-110 active:scale-95",
          showRight ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-85",
        )}
      >
        <ChevronRight className="size-6" />
      </button>
    </div>
  );
}
