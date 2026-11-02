"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, FolderTree, GalleryHorizontalEnd, Inbox, LayoutDashboard, Menu, MessagesSquare, Newspaper, Package, Settings, SlidersHorizontal, Store, Users } from "lucide-react";
import { bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { useRealtimeConnected } from "@/shared/lib/realtime";
import { LogoMark } from "@/shared/ui";
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

  const { data: letters } = useQuery({
    queryKey: ["admin-badge-messages"],
    queryFn: async () => (await bff<{ meta: { unread_count: number } }>("/api/proxy/admin/messages?unread=1&per_page=1", { method: "GET" })).meta.unread_count,
    refetchInterval: interval,
  });

  return { awaiting: awaiting ?? 0, unread: unread ?? 0, letters: letters ?? 0 };
}

function useItems(isAdmin: boolean): Item[] {
  const { t } = useI18n();
  const n = t.admin.nav;
  const { awaiting, unread, letters } = useBadges();

  return [
    { href: routes.admin, label: n.dashboard, icon: LayoutDashboard, exact: true },
    { href: routes.adminOrders, label: n.orders, icon: Package, badge: awaiting },
    { href: routes.adminProducts, label: n.products, icon: Boxes },
    { href: routes.adminCategories, label: n.categories, icon: FolderTree },
    { href: routes.adminChats, label: n.chats, icon: MessagesSquare, badge: unread },
    { href: routes.adminNews, label: n.news, icon: Newspaper },
    { href: routes.adminBanners, label: n.banners, icon: GalleryHorizontalEnd },
    { href: routes.adminMessages, label: n.messages, icon: Inbox, badge: letters },
    ...(isAdmin
      ? [
          { href: routes.adminUsers, label: n.users, icon: Users },
          { href: routes.adminSettings, label: n.storeSettings, icon: SlidersHorizontal },
        ]
      : []),
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
          className={cn(link, isActive(href, exact) ? "bg-brand text-ink shadow-lg shadow-brand/20" : "text-white/65 hover:bg-white/10 hover:text-white")}
        >
          <Icon className="size-[18px]" />
          <span className="flex-1">{label}</span>
          {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white">{badge > 99 ? "99+" : badge}</span> : null}
        </Link>
      ))}

      <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
        <Link href={routes.accountSettings} onClick={onNavigate} className={cn(link, "text-white/65 hover:bg-white/10 hover:text-white")}>
          <Settings className="size-[18px]" />
          {t.admin.nav.settings}
        </Link>
        <Link href={routes.home} onClick={onNavigate} className={cn(link, "border border-brand/40 text-brand hover:bg-brand hover:text-ink")}>
          <Store className="size-[18px]" />
          {t.admin.nav.toSite}
        </Link>
      </div>
    </nav>
  );
}

/** Logo with the "Admin panel" mark: the panel is dark in any theme, so it never looks like the shop. */
function AdminBrand() {
  const { t } = useI18n();

  return (
    <Link href={routes.admin} className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
      <LogoMark className="size-9 shrink-0" />
      <span className="min-w-0 leading-tight">
        <span className="block font-display text-[15px] font-extrabold tracking-tight">BAKHT STROY</span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{t.admin.title}</span>
      </span>
    </Link>
  );
}

/** Left column on desktop. */
export function AdminSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink text-white lg:flex">
      <AdminBrand />
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
      <SheetContent side="left" className="w-72 border-0 bg-ink p-0 text-white">
        <SheetTitle asChild>
          <div>
            <AdminBrand />
          </div>
        </SheetTitle>
        <div className="h-[calc(100%-4rem)] p-3">
          <NavList isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
