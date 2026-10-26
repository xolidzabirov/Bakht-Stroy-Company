"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, Search } from "lucide-react";
import { LocaleSwitcher } from "@/features/preferences/ui/LocaleSwitcher";
import { ThemeToggle } from "@/features/preferences/ui/ThemeToggle";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { formatPhone } from "@/shared/lib/format";
import { Logo } from "@/shared/ui";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/kit/sheet";

type Props = {
  nav: { href: string; label: string }[];
  phone?: string;
};

/**
 * Phone/tablet menu (shadcn/ui sheet from the left): search, sections, language / theme and the call button.
 */
export function MobileMenu({ nav, phone }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger aria-label={t.header.menu} className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-muted lg:hidden">
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] max-w-sm gap-0 overflow-y-auto bg-surface p-5">
        <SheetTitle className="sr-only">{t.header.menu}</SheetTitle>
        <Logo />

        <form action={routes.catalog} className="relative mt-6 md:hidden" onSubmit={() => setOpen(false)}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            type="search"
            placeholder={t.header.searchPlaceholder}
            aria-label={t.header.searchLabel}
            className="h-11 w-full rounded-full border border-border bg-muted pl-10 pr-4 text-sm outline-none focus:border-primary"
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
          <ThemeToggle />
        </div>

        {phone && (
          <a href={`tel:${phone}`} className="mt-auto inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary pt-0 font-bold text-primary-foreground">
            <Phone className="size-4" />
            {formatPhone(phone)}
          </a>
        )}
      </SheetContent>
    </Sheet>
  );
}
