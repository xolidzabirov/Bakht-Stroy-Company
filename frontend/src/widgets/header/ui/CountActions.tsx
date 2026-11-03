"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/entities/cart/api/useCart";
import { useFavoriteIds } from "@/entities/favorite/api/useFavorites";
import { useMe } from "@/shared/api/useMe";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { useSessionName } from "@/shared/lib/useSession";

function Action({ href, label, count, icon, className }: { href: string; label: string; count: number; icon: React.ReactNode; className?: string }) {
  return (
    <Link prefetch={false}
      href={href}
      className={cn("flex min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-foreground transition hover:bg-muted md:min-w-16", className)}
    >
      <span className="relative">
        {icon}
        {count > 0 && (
          <span className="absolute -right-2.5 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-surface bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="sr-only text-[11px] font-medium text-muted-foreground lg:not-sr-only lg:block">{label}</span>
    </Link>
  );
}

/** Favorites with the number of saved products (hidden on the smallest phones and for the shop team). */
export function FavoritesAction() {
  const { t } = useI18n();
  const signedIn = useSessionName() !== null;
  const { isStaff, isCustomer } = useMe();
  const { data: ids } = useFavoriteIds(signedIn && isCustomer);

  if (isStaff) return null;

  return <Action href={routes.favorites} label={t.header.favorites} count={ids?.length ?? 0} icon={<Heart className="size-[22px]" />} className="hidden sm:flex" />;
}

/** Cart with the number of lines in it (not for the shop team — they do not place orders). */
export function CartAction() {
  const { t } = useI18n();
  const { isStaff, isCustomer } = useMe();
  const { data: cart } = useCart({ enabled: isCustomer });

  if (isStaff) return null;

  return <Action href={routes.cart} label={t.header.cart} count={cart?.items_count ?? 0} icon={<ShoppingCart className="size-[22px]" />} />;
}
