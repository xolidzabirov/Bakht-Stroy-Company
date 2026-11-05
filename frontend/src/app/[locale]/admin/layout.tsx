import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { LocaleSwitcher } from "@/features/preferences/ui/LocaleSwitcher";
import { ThemeToggle } from "@/features/preferences/ui/ThemeToggle";
import { isAdmin, requireStaff } from "@/shared/api/requireUser";
import { getCurrentUser } from "@/shared/api/session";
import { adminPath, managerPath } from "@/shared/config/auth";
import { routes } from "@/shared/config/site";
import { I18nProvider } from "@/shared/i18n/client";
import { SkipLink } from "@/shared/ui/SkipLink";
import { getI18n } from "@/shared/i18n/server";
import { AdminBottomNav, AdminMobileNav, AdminSidebar } from "@/widgets/admin-shell/ui/AdminNav";
import { AdminScope } from "@/widgets/admin-shell/ui/AdminScope";
import { QuickCreate } from "@/widgets/admin-shell/ui/QuickCreate";
import { AdminShellSkeleton } from "@/widgets/page-skeletons/ui/AdminSkeletons";
import { NotificationBell } from "@/widgets/header/ui/NotificationBell";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, user] = await Promise.all([getI18n(), getCurrentUser()]);
  const title = user && !isAdmin(user) ? t.admin.managerTitle : t.admin.title;

  return { title: { template: `%s — ${title}`, default: title }, robots: { index: false, follow: false } };
}

/**
 * Admin panel for managers and administrators: the grouped menu on the left (a drawer on phones),
 * a top bar with order search, "Создать" and notifications, the page on the right.
 * Customers who open /admin go to their account.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const path = (await headers()).get("x-pathname") ?? routes.admin;

  return (
    <Suspense fallback={<AdminShellSkeleton path={path} />}>
      <AdminShell path={path}>{children}</AdminShell>
    </Suspense>
  );
}

/** Waits for the session on a first visit: until then the skeleton of the panel and of this very page stands in its place. */
async function AdminShell({ path, children }: Readonly<{ path: string; children: React.ReactNode }>) {
  const [user, { t, locale }] = await Promise.all([requireStaff(routes.admin), getI18n()]);
  const admin = isAdmin(user);
  const shell = { name: user.name, isAdmin: admin };

  // The wrong panel's address: a session from before /manager or a changed role. A new token brings the right cookie.
  if (admin === path.startsWith("/manager")) redirect(`/api/auth/refresh?next=${encodeURIComponent(admin ? adminPath(path) : managerPath(path))}`);

  return (
    <I18nProvider locale={locale} dictionary={t}>
    <div className="admin-ui flex h-dvh bg-background">
      <AdminScope />
      <SkipLink />
      <AdminSidebar user={shell} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface/80 px-3 backdrop-blur sm:gap-3 sm:px-5 lg:px-8">
          <AdminMobileNav user={shell} />

          {/* Find an order from any page: number, phone, name or email. */}
          <form action={routes.adminOrders} role="search" className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="search"
              type="search"
              placeholder={t.admin.orders.searchPlaceholder}
              aria-label={`${t.admin.common.search}: ${t.admin.nav.orders}`}
              className="h-10 w-full rounded-lg border border-border bg-muted/60 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20"
            />
          </form>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <QuickCreate isAdmin={admin} />
            <NotificationBell />
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main id="content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
          <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-8">{children}</div>
        </main>
        <AdminBottomNav isAdmin={admin} />
      </div>
    </div>
    </I18nProvider>
  );
}
