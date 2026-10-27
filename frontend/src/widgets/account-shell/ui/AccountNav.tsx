"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Heart, LayoutDashboard, MapPin, MessageCircle, Package, Settings, UserRound } from "lucide-react";
import { useChatInfo } from "@/entities/chat/api/useChatInfo";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";

/**
 * Account sections: a vertical list on desktop, a bottom tab bar on phones (like a mobile app).
 */
export function AccountNav({ unread, variant }: { unread: number; variant: "side" | "bottom" }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { data: chat } = useChatInfo(true, { silent: pathname === routes.accountChat });

  const items = [
    { href: routes.account, label: t.acc.nav.overview, icon: LayoutDashboard, exact: true },
    { href: routes.accountProfile, label: t.acc.nav.profile, icon: UserRound },
    { href: routes.accountOrders, label: t.acc.nav.orders, icon: Package },
    { href: routes.accountChat, label: t.acc.nav.chat, icon: MessageCircle, badge: chat?.unread_count },
    { href: routes.favorites, label: t.acc.nav.favorites, icon: Heart },
    { href: routes.accountAddresses, label: t.acc.nav.addresses, icon: MapPin },
    { href: routes.accountNotifications, label: t.acc.nav.notifications, icon: Bell, badge: unread },
    { href: routes.accountSettings, label: t.acc.nav.settings, icon: Settings },
  ];

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  if (variant === "bottom") {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="flex overflow-x-auto [scrollbar-width:none]">
          {items.map(({ href, label, icon: Icon, exact, badge }) => (
            <li key={href} className="min-w-[4.5rem] flex-1">
              <Link href={href} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold", isActive(href, exact) ? "text-foreground" : "text-muted-foreground")}>
                <span className="relative">
                  <Icon className={cn("size-5", isActive(href, exact) && "text-primary")} />
                  {badge ? <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] text-white">{badge}</span> : null}
                </span>
                <span className="max-w-full truncate px-0.5">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon, exact, badge }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href, exact) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            isActive(href, exact) ? "bg-ink text-white dark:bg-white dark:text-ink" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className={cn("size-[18px]", isActive(href, exact) && "text-brand dark:text-ink")} />
          <span className="flex-1">{label}</span>
          {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[11px] text-white">{badge}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
