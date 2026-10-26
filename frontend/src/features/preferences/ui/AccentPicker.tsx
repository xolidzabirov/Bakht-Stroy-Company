"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { accents, accentSwatches, type Accent } from "@/shared/i18n/config";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { applyAccent } from "../model/preferences";

/**
 * Palette button with the number of the chosen accent color; the color changes instantly.
 */
export function AccentPicker({ initial, className }: { initial: Accent; className?: string }) {
  const { t } = useI18n();
  const [accent, setAccent] = useState<Accent>(initial);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => ref.current && !ref.current.contains(event.target as Node) && setOpen(false);
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const choose = (next: Accent) => {
    setAccent(next);
    setOpen(false);
    applyAccent(next);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={t.header.accent} title={t.header.accent} className="pill-button relative size-10 px-0">
        <Palette className="size-[18px]" />
        <span className="absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full border-2 border-surface bg-brand text-[10px] font-bold text-on-brand">
          {accents.indexOf(accent) + 1}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-border bg-surface p-2 shadow-xl shadow-black/10">
          <p className="px-2 pb-1.5 pt-1 text-xs font-semibold text-muted">{t.header.accent}</p>
          {accents.map((item, i) => (
            <button
              key={item}
              type="button"
              onClick={() => choose(item)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm transition hover:bg-surface-muted"
            >
              <span className="size-6 rounded-full ring-2 ring-surface ring-offset-1 ring-offset-border" style={{ background: accentSwatches[item] }} />
              <span className="flex-1 text-left">
                {i + 1}. {t.header.accents[item]}
              </span>
              {item === accent && <Check className="size-4 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
