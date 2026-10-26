"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Globe } from "lucide-react";
import { localeNames, locales, type Locale } from "@/shared/i18n/config";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { saveLocale } from "../model/preferences";

/**
 * 🌐 RU / TJ / EN. The choice goes to a cookie for a year; the server re-renders the page in the new language.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
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

  const choose = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;

    saveLocale(next);
    startTransition(() => router.refresh());
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t.header.language}
        className={cn("pill-button gap-2 px-3.5", pending && "opacity-60")}
      >
        <Globe className="size-[18px]" />
        <span className="text-sm font-bold">{localeNames[locale].short}</span>
      </button>

      {open && (
        <ul className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-border bg-surface p-2 shadow-xl shadow-black/10">
          {locales.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => choose(item)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm transition hover:bg-surface-muted"
              >
                <span className="grid h-6 w-8 place-items-center rounded-md bg-surface-muted text-[11px] font-bold">{localeNames[item].short}</span>
                <span className="flex-1 text-left">{localeNames[item].name}</span>
                {item === locale && <Check className="size-4 text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
