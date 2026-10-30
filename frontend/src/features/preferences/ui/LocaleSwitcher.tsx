"use client";

import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { localeNames, locales, type Locale } from "@/shared/i18n/config";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/shared/ui/kit/dropdown-menu";
import { saveLocale } from "../model/preferences";

/**
 * 🌐 RU / TJ / EN (shadcn/ui dropdown). The choice goes to a cookie for a year;
 * the page reloads in the new language (every language is a separate prerendered page).
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const [pending, setPending] = useState(false);

  const choose = (next: Locale) => {
    if (next === locale) return;

    saveLocale(next);
    setPending(true);
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`${localeNames[locale].short} — ${t.header.language}`} className={cn("pill-button gap-2 px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50", pending && "opacity-60", className)}>
        <Globe className="size-[18px]" />
        <span className="text-sm font-bold">{localeNames[locale].short}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t.header.language}</DropdownMenuLabel>
        {locales.map((item) => (
          <DropdownMenuItem key={item} onSelect={() => choose(item)} className="gap-3 rounded-lg py-2">
            <span className="grid h-6 w-8 place-items-center rounded-md bg-muted text-[11px] font-bold">{localeNames[item].short}</span>
            <span className="flex-1">{localeNames[item].name}</span>
            {item === locale && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
