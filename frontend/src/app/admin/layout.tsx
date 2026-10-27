import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LocaleSwitcher } from "@/features/preferences/ui/LocaleSwitcher";
import { ThemeToggle } from "@/features/preferences/ui/ThemeToggle";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { Logo } from "@/shared/ui";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Admin panel for managers and administrators. Customers who open /admin go to their account.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, { t }] = await Promise.all([requireUser(routes.admin), getI18n()]);

  if (!user.is_staff) redirect(routes.account);

  const role = user.roles?.includes("admin") ? "admin" : "manager";

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-surface">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link href={routes.adminChats} aria-label={t.chat.inbox}>
            <Logo />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-brand sm:inline-flex">
            <ShieldCheck className="size-3.5" />
            {t.acc.profile.roles[role]}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Link href={routes.home} className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex">
              <ArrowLeft className="size-4" />
              {t.chat.toSite}
            </Link>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 p-2 sm:p-4">{children}</main>
    </div>
  );
}
