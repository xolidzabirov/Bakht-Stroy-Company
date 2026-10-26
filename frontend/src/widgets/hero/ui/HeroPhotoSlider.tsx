"use client";

import Image from "next/image";
import { useSlider } from "@/shared/lib/useSlider";
import { cn } from "@/shared/lib/cn";
import { SlideProgress } from "@/shared/ui";

export type HeroSlide = { src: string; title: string; label: string };

const DURATION = 6000;

/**
 * Photo carousel in the first screen: each photo stays ~6 s, slowly zooming in,
 * then softly dissolves into the next one. White bars on top show the time left.
 */
export function HeroPhotoSlider({ slides }: { slides: HeroSlide[] }) {
  const { index, setIndex, paused, handlers } = useSlider(slides.length, DURATION);

  return (
    <div {...handlers} className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-white/5 ring-1 ring-white/10 lg:aspect-[5/4]">
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1400ms] ease-in-out motion-reduce:transition-none",
            i === index ? "z-10 opacity-100" : "z-0 opacity-0",
          )}
        >
          <Image
            src={slide.src}
            alt={slide.title}
            fill
            priority={i === 0}
            sizes="(max-width: 1024px) 100vw, 45vw"
            className={cn(
              "object-cover transition-transform ease-out motion-reduce:transition-none",
              // the visible photo slowly zooms in; hidden ones reset quietly behind it
              i === index ? "scale-110 duration-[7000ms]" : "scale-100 duration-0 delay-[1400ms]",
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 p-6 text-white transition-all duration-700 sm:p-8",
              i === index ? "translate-y-0 opacity-100 delay-300" : "translate-y-4 opacity-0",
            )}
          >
            <span className="inline-flex rounded-full bg-brand px-3 py-1 text-xs font-bold text-ink">{slide.label}</span>
            <p className="mt-3 max-w-md font-display text-2xl font-extrabold leading-tight sm:text-3xl">{slide.title}</p>
          </div>
        </div>
      ))}

      <SlideProgress
        count={slides.length}
        index={index}
        duration={DURATION}
        paused={paused}
        onSelect={setIndex}
        className="absolute inset-x-5 top-3 z-20 sm:inset-x-8 sm:top-5"
      />
    </div>
  );
}
