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
type Group = { label: string; items: Item[] };
export type AdminUser = { name: string; isAdmin: boolean };

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

/** The menu in groups, like the work goes: sales, catalog, content, and (administrators only) management. */
function useGroups(isAdmin: boolean): Group[] {
  const { t } = useI18n();
  const n = t.admin.nav;
  const g = t.admin.groups;
  const { awaiting, unread, letters } = useBadges();

  return [
    { label: g.overview, items: [{ href: routes.admin, label: n.dashboard, icon: LayoutDashboard, exact: true }] },
    {
      label: g.sales,
      items: [
        { href: routes.adminOrders, label: n.orders, icon: Package, badge: awaiting },
        { href: routes.adminChats, label: n.chats, icon: MessagesSquare, badge: unread },
        { href: routes.adminMessages, label: n.messages, icon: Inbox, badge: letters },
      ],
    },
    {
      label: g.catalog,
      items: [
        { href: routes.adminProducts, label: n.products, icon: Boxes },
        { href: routes.adminCategories, label: n.categories, icon: FolderTree },
      ],
    },
    {
      label: g.content,
      items: [
        { href: routes.adminNews, label: n.news, icon: Newspaper },
        { href: routes.adminBanners, label: n.banners, icon: GalleryHorizontalEnd },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: g.manage,
            items: [
              { href: routes.adminUsers, label: n.users, icon: Users },
              { href: routes.adminSettings, label: n.storeSettings, icon: SlidersHorizontal },
            ],
          },
        ]
      : []),
  ];
}

function NavList({ user, onNavigate }: { user: AdminUser; onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const groups = useGroups(user.isAdmin);
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const role = t.acc.profile.roles[user.isAdmin ? "admin" : "manager"];

  return (
    <nav aria-label={t.admin.menu} className="flex h-full flex-col">
      <div className="admin-nav-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact, badge }) => {
                const active = isActive(href, exact);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                        active ? "bg-white/[0.09] text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                      )}
                    >
                      {/* The brand mark on the left edge shows where you are. */}
                      <span aria-hidden className={cn("absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-brand transition-opacity", active ? "opacity-100" : "opacity-0")} />
                      <Icon className={cn("size-[18px] shrink-0 transition-colors", active ? "text-brand" : "text-white/45 group-hover:text-white/80")} />
                      <span className="flex-1 truncate">{label}</span>
                      {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-ink tabular-nums">{badge > 99 ? "99+" : badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Who is signed in, with their settings and the way back to the shop. */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-ink">{user.name.charAt(0).toUpperCase()}</span>
          <span className="min-w-0 flex-1 leading-tight">
            <b className="block truncate text-sm text-white">{user.name}</b>
            {/* The seeded account is called just "Администратор" — no need to say it twice. */}
            {user.name !== role && <span className="block truncate text-xs text-white/50">{role}</span>}
          </span>
          <Link href={routes.accountSettings} onClick={onNavigate} aria-label={t.admin.nav.settings} title={t.admin.nav.settings} className="grid size-8 shrink-0 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white">
            <Settings className="size-4" />
          </Link>
        </div>
        <Link
          href={routes.home}
          onClick={onNavigate}
          className="mt-2 flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 text-xs font-semibold text-white/70 transition hover:border-brand/50 hover:text-brand"
        >
          <Store className="size-4" />
          {t.admin.nav.toSite}
        </Link>
      </div>
    </nav>
  );
}

/** Logo with the "Admin panel" (or "Manager panel") mark: the panel is dark in any theme, so it never looks like the shop. */
function AdminBrand({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useI18n();

  return (
    <Link href={routes.admin} className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
      <LogoMark className="size-9 shrink-0" />
      <span className="min-w-0 leading-tight">
        <span className="block text-[15px] font-bold tracking-tight text-white">BAKHT STROY</span>
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand">{isAdmin ? t.admin.title : t.admin.managerTitle}</span>
      </span>
    </Link>
  );
}

/** Left column on desktop. */
export function AdminSidebar({ user }: { user: AdminUser }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink lg:flex dark:border-r dark:border-white/10">
      <AdminBrand isAdmin={user.isAdmin} />
      <div className="min-h-0 flex-1">
        <NavList user={user} />
      </div>
    </aside>
  );
}

/** "☰" button in the top bar on phones and tablets. */
export function AdminMobileNav({ user }: { user: AdminUser }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger aria-label={t.admin.menu} className="grid size-10 place-items-center rounded-xl hover:bg-muted lg:hidden">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col border-0 bg-ink p-0 text-white">
        <SheetTitle asChild>
          <div>
            <AdminBrand isAdmin={user.isAdmin} />
          </div>
        </SheetTitle>
        <div className="min-h-0 flex-1">
          <NavList user={user} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
