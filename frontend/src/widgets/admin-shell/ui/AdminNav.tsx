"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, FolderTree, LayoutDashboard, Menu, MessagesSquare, Package, Settings, Store, Users } from "lucide-react";
import { bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { useRealtimeConnected } from "@/shared/lib/realtime";
import { Logo } from "@/shared/ui";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/kit/sheet";

type Item = { href: string; label: string; icon: typeof Package; exact?: boolean; badge?: number };

/** New orders and unread chats for the menu badges (refreshed every minute, or more often without WebSocket). */
function useBadges() {
  const connected = useRealtimeConnected();
  const interval = connected ? 60_000 : 20_000;

  const { data: awaiting } = useQuery({
    queryKey: ["admin-badge-orders"],
    queryFn: async () => (await bff<{ meta: { total: number } }>("/api/proxy/admin/orders?status=new&per_page=1", { method: "GET" })).meta.total,
    refetchInterval: interval,
  });
  const { data: unread } = useQuery({
    queryKey: ["admin-badge-chats"],
    queryFn: async () => (await bff<{ meta: { unread_conversations: number } }>("/api/proxy/admin/chats?filter=unread&per_page=1", { method: "GET" })).meta.unread_conversations,
    refetchInterval: interval,
  });

  return { awaiting: awaiting ?? 0, unread: unread ?? 0 };
}

function useItems(isAdmin: boolean): Item[] {
  const { t } = useI18n();
  const n = t.admin.nav;
  const { awaiting, unread } = useBadges();

  return [
    { href: routes.admin, label: n.dashboard, icon: LayoutDashboard, exact: true },
    { href: routes.adminOrders, label: n.orders, icon: Package, badge: awaiting },
    { href: routes.adminProducts, label: n.products, icon: Boxes },
    { href: routes.adminCategories, label: n.categories, icon: FolderTree },
    { href: routes.adminChats, label: n.chats, icon: MessagesSquare, badge: unread },
    ...(isAdmin ? [{ href: routes.adminUsers, label: n.users, icon: Users }] : []),
  ];
}

function NavList({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = useItems(isAdmin);
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const link = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition";

  return (
    <nav aria-label={t.admin.menu} className="flex h-full flex-col gap-1">
      {items.map(({ href, label, icon: Icon, exact, badge }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          aria-current={isActive(href, exact) ? "page" : undefined}
          className={cn(link, isActive(href, exact) ? "bg-ink text-white dark:bg-white dark:text-ink" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
        >
          <Icon className={cn("size-[18px]", isActive(href, exact) && "text-brand dark:text-ink")} />
          <span className="flex-1">{label}</span>
          {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-ink">{badge > 99 ? "99+" : badge}</span> : null}
        </Link>
      ))}

      <div className="mt-auto space-y-1 border-t border-border pt-3">
        <Link href={routes.accountSettings} onClick={onNavigate} className={cn(link, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
          <Settings className="size-[18px]" />
          {t.admin.nav.settings}
        </Link>
        <Link href={routes.home} onClick={onNavigate} className={cn(link, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
          <Store className="size-[18px]" />
          {t.admin.nav.toSite}
        </Link>
      </div>
    </nav>
  );
}

/** Left column on desktop. */
export function AdminSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <Link href={routes.admin} className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <NavList isAdmin={isAdmin} />
      </div>
    </aside>
  );
}

/** "☰" button in the top bar on phones and tablets. */
export function AdminMobileNav({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger aria-label={t.admin.menu} className="grid size-10 place-items-center rounded-xl hover:bg-muted lg:hidden">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </SheetTitle>
        <div className="h-[calc(100%-4rem)] p-3">
          <NavList isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
