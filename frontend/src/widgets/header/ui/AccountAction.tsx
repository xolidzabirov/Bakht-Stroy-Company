"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Settings, ShieldCheck, User, UserRound } from "lucide-react";
import { bff } from "@/shared/api/client";
import { useMe } from "@/shared/api/useMe";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { formatPhone } from "@/shared/lib/format";
import { disconnectRealtime } from "@/shared/lib/realtime";
import { useSessionName } from "@/shared/lib/useSession";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";

const triggerClass = "flex min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-foreground outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 md:min-w-16";

/**
 * Guests: "Войти". Signed-in users: the first name with a green dot; a click opens a menu.
 * Customers get their account and profile; the shop team gets the admin panel and settings.
 */
export function AccountAction() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const name = useSessionName();
  const { data: me, isStaff } = useMe();

  if (!name) {
    return (
      <Link href={routes.login} aria-label={t.header.login} className={triggerClass}>
        <User className="size-[22px]" />
        <span className="hidden text-[11px] font-medium text-muted-foreground lg:block">{t.header.login}</span>
      </Link>
    );
  }

  const logout = async () => {
    await bff("/api/auth/logout").catch(() => null);
    disconnectRealtime();
    queryClient.clear();
    router.replace(routes.home);
    router.refresh();
  };

  const items = isStaff
    ? [
        { href: routes.admin, icon: ShieldCheck, label: t.nav.admin },
        { href: routes.accountSettings, icon: Settings, label: t.acc.nav.settings },
      ]
    : [
        { href: routes.account, icon: LayoutDashboard, label: t.nav.account },
        { href: routes.accountProfile, icon: UserRound, label: t.acc.nav.profile },
      ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={fmt(t.header.accountOf, { name })} className={triggerClass}>
        <span className="relative">
          <User className="size-[22px]" />
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-success" />
        </span>
        <span className="hidden max-w-20 truncate text-[11px] font-medium text-muted-foreground lg:block">{name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-72 rounded-2xl p-2">
        <DropdownMenuLabel className="flex items-center gap-3 p-2">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-extrabold text-brand ring-2 ring-brand ring-offset-2 ring-offset-popover">
            {(me?.name ?? name).charAt(0)}
          </span>
          <span className="min-w-0">
            <b className="block truncate text-sm">{me?.name ?? name}</b>
            <span className="block truncate text-xs font-normal text-muted-foreground">{me ? (me.phone ? formatPhone(me.phone) : me.email) : "…"}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map(({ href, icon: Icon, label }) => (
          <DropdownMenuItem key={href} asChild className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 font-medium">
            <Link href={href}>
              <Icon className="size-4" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout} className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="size-4" />
          {t.acc.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
