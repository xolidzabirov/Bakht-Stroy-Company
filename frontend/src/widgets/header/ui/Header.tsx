import Link from "next/link";
import { Clock, Heart, Phone, Search, ShoppingCart, User } from "lucide-react";
import { getCategories } from "@/entities/category/api/getCategories";
import { getSettings } from "@/entities/settings/api/getSettings";
import { routes } from "@/shared/config/site";
import { formatPhone } from "@/shared/lib/format";
import { Container, Logo } from "@/shared/ui";
import { CatalogMenu } from "./CatalogMenu";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";

const nav = [
  { href: routes.catalog, label: "Каталог" },
  { href: routes.delivery, label: "Доставка и оплата" },
  { href: routes.news, label: "Новости и акции" },
  { href: routes.about, label: "О компании" },
  { href: routes.contacts, label: "Контакты" },
];

/**
 * Site header: logo, catalog, search and actions in one row; site sections and hours in a slim row below.
 */
export async function Header() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const mainPhone = settings.phones[0];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <Container className="flex h-16 items-center gap-3 md:h-[76px] md:gap-5">
        <MobileMenu nav={nav} phone={mainPhone} />

        <Link href={routes.home} aria-label="Bakht Stroy — на главную" className="shrink-0">
          <Logo />
        </Link>

        <CatalogMenu categories={categories} />

        <form action={routes.catalog} role="search" className="relative hidden flex-1 md:flex">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            name="search"
            type="search"
            placeholder="Поиск: цемент, кирпич, трубы…"
            aria-label="Поиск товаров"
            className="h-11 w-full rounded-xl border border-border bg-surface-muted pl-11 pr-24 text-sm outline-none transition focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/25"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-brand px-4 text-sm font-semibold text-ink transition hover:bg-brand-hover"
          >
            Найти
          </button>
        </form>

        {mainPhone && (
          <a href={`tel:${mainPhone}`} className="hidden shrink-0 items-center gap-2.5 xl:flex">
            <span className="grid size-10 place-items-center rounded-full bg-brand-soft">
              <Phone className="size-4 text-foreground" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-extrabold">{formatPhone(mainPhone)}</span>
              <span className="block text-xs text-muted">Бесплатная консультация</span>
            </span>
          </a>
        )}

        <div className="ml-auto flex items-center md:ml-0">
          <Action href={routes.favorites} label="Избранное" className="hidden sm:flex">
            <Heart className="size-[22px]" />
          </Action>
          <Action href={routes.account} label="Войти">
            <User className="size-[22px]" />
          </Action>
          <Action href={routes.cart} label="Корзина">
            <ShoppingCart className="size-[22px]" />
          </Action>
        </div>
      </Container>

      <div className="hidden border-t border-border md:block">
        <Container className="flex h-11 items-center justify-between gap-6">
          <NavLinks items={nav} />
          {settings.work_hours && (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
              <Clock className="size-3.5" />
              {settings.work_hours}
            </span>
          )}
        </Container>
      </div>
    </header>
  );
}

/** Icon with a caption under it (caption is hidden on small screens). */
function Action({ href, label, className = "", children }: { href: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-foreground transition hover:bg-surface-muted md:min-w-16 ${className}`}
    >
      {children}
      <span className="hidden text-[11px] font-medium text-muted lg:block">{label}</span>
    </Link>
  );
}
