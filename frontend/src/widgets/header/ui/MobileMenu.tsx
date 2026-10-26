"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, Search, X } from "lucide-react";
import { AccentPicker } from "@/features/preferences/ui/AccentPicker";
import { LocaleSwitcher } from "@/features/preferences/ui/LocaleSwitcher";
import { ThemeToggle } from "@/features/preferences/ui/ThemeToggle";
import { routes } from "@/shared/config/site";
import type { Accent } from "@/shared/i18n/config";
import { useI18n } from "@/shared/i18n/client";
import { formatPhone } from "@/shared/lib/format";
import { Logo } from "@/shared/ui";

type Props = {
  nav: { href: string; label: string }[];
  phone?: string;
  accent: Accent;
};

/**
 * Phone/tablet menu: search, sections, language / color / theme and the call button.
 */
export function MobileMenu({ nav, phone, accent }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button type="button" aria-label={t.header.menu} onClick={() => setOpen(true)} className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted">
        <Menu className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button type="button" aria-label={t.header.closeMenu} className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label={t.header.close}
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-xl hover:bg-surface-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={routes.catalog} className="relative mt-6 md:hidden">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                name="search"
                type="search"
                placeholder={t.header.searchPlaceholder}
                aria-label={t.header.searchLabel}
                className="h-11 w-full rounded-full border border-border bg-surface-muted pl-10 pr-4 text-sm outline-none focus:border-brand"
              />
            </form>

            <nav className="mt-6 flex flex-col">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-border py-3.5 text-base font-semibold">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 flex items-center gap-2">
              <LocaleSwitcher />
              <AccentPicker initial={accent} />
              <ThemeToggle />
            </div>

            {phone && (
              <a href={`tel:${phone}`} className="mt-auto inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand font-bold text-on-brand">
                <Phone className="size-4" />
                {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
