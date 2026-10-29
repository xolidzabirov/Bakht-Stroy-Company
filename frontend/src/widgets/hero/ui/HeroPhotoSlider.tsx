"use client";

import { useEffect, useState } from "react";
import { preload } from "react-dom";
import { useSlider } from "@/shared/lib/useSlider";
import { cn } from "@/shared/lib/cn";
import { SlideProgress } from "@/shared/ui";

/** `src` is the file name without the size: /hero/mixer → /hero/mixer-720.webp, /hero/mixer-1280.webp. */
export type HeroSlide = { src: string; title: string; label: string };

const DURATION = 6000;
const SIZES = "(max-width: 1024px) 100vw, 45vw";
const srcSet = (src: string) => `${src}-720.webp 720w, ${src}-1280.webp 1280w`;

/**
 * Photo carousel in the first screen: each photo stays ~6 s, slowly zooming in,
 * then softly dissolves into the next one. White bars on top show the time left.
 * Only the first photo loads with the page (it is the largest element of the first screen);
 * the others start loading a couple of seconds later, long before their turn.
 */
export function HeroPhotoSlider({ slides }: { slides: HeroSlide[] }) {
  const { index, setIndex, go, paused, handlers } = useSlider(slides.length);
  const [warm, setWarm] = useState(false);

  if (slides[0])
    preload(`${slides[0].src}-720.webp`, {
      as: "image",
      imageSrcSet: srcSet(slides[0].src),
      imageSizes: SIZES,
      fetchPriority: "high",
    });

  useEffect(() => {
    const timer = setTimeout(() => setWarm(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      {...handlers}
      className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-white/5 ring-1 ring-white/10 lg:aspect-[5/4]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1400ms] ease-in-out motion-reduce:transition-none",
            i === index ? "z-10 opacity-100" : "z-0 opacity-0",
          )}
        >
          {(i === 0 || i === index || warm) && (
            // eslint-disable-next-line @next/next/no-img-element -- prepared WebP sizes, no image optimizer
            <img
              src={`${slide.src}-720.webp`}
              srcSet={srcSet(slide.src)}
              sizes={SIZES}
              alt={slide.title}
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
              className={cn(
                "absolute inset-0 size-full object-cover transition-transform ease-out motion-reduce:transition-none",
                // the visible photo slowly zooms in; hidden ones reset quietly behind it
                i === index
                  ? "scale-110 duration-[7000ms]"
                  : "scale-100 duration-0 delay-[1400ms]",
              )}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 p-6 text-white transition-all duration-700 sm:p-8",
              i === index
                ? "translate-y-0 opacity-100 delay-300"
                : "translate-y-4 opacity-0",
            )}
          >
            <span className="inline-flex rounded-full bg-brand px-3 py-1 text-xs font-bold text-on-brand">
              {slide.label}
            </span>
            <p className="mt-3 max-w-md font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              {slide.title}
            </p>
          </div>
        </div>
      ))}

      <SlideProgress
        count={slides.length}
        index={index}
        duration={DURATION}
        paused={paused}
        onSelect={setIndex}
        onComplete={() => go(1)}
        className="absolute inset-x-5 top-3 z-20 sm:inset-x-8 sm:top-5"
      />
    </div>
  );
}
