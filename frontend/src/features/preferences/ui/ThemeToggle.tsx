"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { toggleTheme } from "../model/preferences";

/**
 * Round moon/sun button: switches between light and dark right away (no reload) and remembers the choice.
 * Until the visitor clicks it, the site follows the device setting. Both icons are rendered and CSS
 * shows the right one, so the server and the browser draw the same markup.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`${t.header.theme}: ${t.header.themes.light} / ${t.header.themes.dark}`}
      title={t.header.theme}
      className={cn("pill-button size-10 px-0", className)}
    >
      <Moon className="size-[18px] dark:hidden" />
      <Sun className="hidden size-[18px] dark:block" />
    </button>
  );
}
