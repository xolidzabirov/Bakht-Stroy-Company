import Link from "next/link";
import { Clock, Heart, MapPin, Phone, Search, ShoppingCart, User } from "lucide-react";
import { getCategories } from "@/entities/category/api/getCategories";
import { getSettings } from "@/entities/settings/api/getSettings";
import { routes } from "@/shared/config/site";
import { formatPhone } from "@/shared/lib/format";
import { Container, Logo } from "@/shared/ui";
import { CatalogMenu } from "./CatalogMenu";
import { MobileMenu } from "./MobileMenu";

const nav = [
  { href: routes.catalog, label: "Каталог" },
  { href: routes.news, label: "Новости и акции" },
  { href: routes.delivery, label: "Доставка и оплата" },
  { href: routes.about, label: "О компании" },
  { href: routes.contacts, label: "Контакты" },
];

export async function Header() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const mainPhone = settings.phones[0];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* Top bar: address, hours, phone */}
      <div className="hidden bg-ink text-white/80 md:block">
        <Container className="flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            {settings.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-brand" />
                {settings.address}
              </span>
            )}
            {settings.work_hours && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-brand" />
                {settings.work_hours}
              </span>
            )}
          </div>
          <nav className="flex items-center gap-5">
            {nav.slice(1).map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>

      <Container className="flex h-16 items-center gap-3 md:h-20 md:gap-6">
        <MobileMenu nav={nav} phone={mainPhone} />

        <Link href={routes.home} aria-label="Bakht Stroy — на главную" className="shrink-0">
          <Logo className="[&_svg]:size-9 md:[&_svg]:size-10" />
        </Link>

        <CatalogMenu categories={categories} />

        <form action={routes.catalog} className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            name="search"
            type="search"
            placeholder="Цемент, кирпич, трубы, окна…"
            className="h-11 w-full rounded-xl border border-border bg-surface-muted pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:bg-surface"
          />
        </form>

        {mainPhone && (
          <a href={`tel:${mainPhone}`} className="hidden shrink-0 flex-col leading-tight xl:flex">
            <span className="inline-flex items-center gap-1.5 font-display text-base font-extrabold">
              <Phone className="size-4 text-brand" />
              {formatPhone(mainPhone)}
            </span>
            <span className="text-xs text-muted">Звоните, проконсультируем</span>
          </a>
        )}

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <IconLink href={routes.favorites} label="Избранное" className="hidden sm:inline-flex">
            <Heart className="size-5" />
          </IconLink>
          <IconLink href={routes.account} label="Кабинет">
            <User className="size-5" />
          </IconLink>
          <IconLink href={routes.cart} label="Корзина" highlight>
            <ShoppingCart className="size-5" />
          </IconLink>
        </div>
      </Container>
    </header>
  );
}

function IconLink({
  href,
  label,
  highlight = false,
  className = "",
  children,
}: {
  href: string;
  label: string;
  highlight?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 items-center justify-center rounded-xl transition ${
        highlight ? "bg-brand text-ink hover:bg-brand-hover" : "text-foreground hover:bg-surface-muted"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
