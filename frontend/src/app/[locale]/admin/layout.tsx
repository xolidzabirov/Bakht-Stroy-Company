import type { Metadata } from "next";
import { ShieldCheck, Store } from "lucide-react";
import { LocaleSwitcher } from "@/features/preferences/ui/LocaleSwitcher";
import { ThemeToggle } from "@/features/preferences/ui/ThemeToggle";
import { isAdmin, requireStaff } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { ButtonLink } from "@/shared/ui";
import { getI18n } from "@/shared/i18n/server";
import { AdminMobileNav, AdminSidebar } from "@/widgets/admin-shell/ui/AdminNav";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return { title: { template: `%s — ${t.admin.title}`, default: t.admin.title }, robots: { index: false, follow: false } };
}

/**
 * Admin panel for managers and administrators: menu on the left (a drawer on phones), page on the right.
 * Customers who open /admin go to their account.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, { t }] = await Promise.all([requireStaff(routes.admin), getI18n()]);
  const admin = isAdmin(user);

  return (
    <div className="flex h-dvh bg-muted/50">
      <AdminSidebar isAdmin={admin} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b-2 border-brand bg-surface px-3 sm:px-5">
          <AdminMobileNav isAdmin={admin} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-brand">
            <ShieldCheck className="size-3.5" />
            {t.acc.profile.roles[admin ? "admin" : "manager"]}
          </span>
          <span className="hidden truncate text-sm font-semibold text-muted-foreground sm:block">{user.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href={routes.home} variant="dark" size="sm" className="hidden sm:inline-flex">
              <Store className="size-4" />
              {t.admin.nav.toSite}
            </ButtonLink>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
