import Link from "next/link";
import { Clock, Phone, Search } from "lucide-react";
import { getCategories } from "@/entities/category/api/getCategories";
import { getSettings } from "@/entities/settings/api/getSettings";
import { LocaleSwitcher } from "@/features/preferences/ui/LocaleSwitcher";
import { ThemeToggle } from "@/features/preferences/ui/ThemeToggle";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { formatPhone } from "@/shared/lib/format";
import { Container, Logo } from "@/shared/ui";
import { AccountAction } from "./AccountAction";
import { CatalogMenu } from "./CatalogMenu";
import { CartAction, FavoritesAction } from "./CountActions";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";

/**
 * Site header. Main row: logo, catalog menu, search, language / theme, account actions.
 * Slim row below: site sections on the left, phone and working hours on the right.
 */
export async function Header() {
  const [settings, categories, { t }] = await Promise.all([getSettings(), getCategories(), getI18n()]);
  const mainPhone = settings.phones[0];

  const sections = [
    { href: routes.home, label: t.nav.home },
    { href: routes.delivery, label: t.nav.delivery },
    { href: routes.news, label: t.nav.news },
    { href: routes.about, label: t.nav.about },
    { href: routes.contacts, label: t.nav.contacts },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <Container className="flex h-16 items-center gap-3 md:h-[76px] md:gap-4">
        <MobileMenu nav={[sections[0], { href: routes.catalog, label: t.nav.catalog }, ...sections.slice(1)]} phone={mainPhone} />

        <Link href={routes.home} aria-label={t.header.homeAria} className="shrink-0">
          <Logo />
        </Link>

        <CatalogMenu categories={categories} />

        <form action={routes.catalog} role="search" className="relative hidden flex-1 md:flex">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            type="search"
            placeholder={t.header.searchPlaceholder}
            aria-label={t.header.searchLabel}
            className="h-11 w-full rounded-full border border-border bg-surface-muted pl-11 pr-24 text-sm outline-none transition focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/25"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full bg-brand px-4 text-sm font-semibold text-on-brand transition hover:bg-brand-hover"
          >
            {t.header.find}
          </button>
        </form>

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <div className="ml-auto flex items-center md:ml-0">
          <FavoritesAction />
          <AccountAction />
          <CartAction />
        </div>
      </Container>

      <div className="hidden border-t border-border md:block">
        <Container className="flex h-11 items-center justify-between gap-6">
          <NavLinks items={sections} label={t.header.sections} />
          <div className="flex shrink-0 items-center gap-5 text-xs text-muted-foreground">
            {mainPhone && (
              <a href={`tel:${mainPhone}`} className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-brand">
                <Phone className="size-3.5 text-brand" />
                {formatPhone(mainPhone)}
                <span className="hidden font-normal text-muted-foreground xl:inline">· {t.header.consult}</span>
              </a>
            )}
            {settings.work_hours && (
              <span className="hidden items-center gap-1.5 lg:inline-flex">
                <Clock className="size-3.5" />
                {settings.work_hours}
              </span>
            )}
          </div>
        </Container>
      </div>
    </header>
  );
}

