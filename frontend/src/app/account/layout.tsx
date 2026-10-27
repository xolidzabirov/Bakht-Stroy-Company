import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LocaleSwitcher } from "@/features/preferences/ui/LocaleSwitcher";
import { ThemeToggle } from "@/features/preferences/ui/ThemeToggle";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { requireUser } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { formatPhone } from "@/shared/lib/format";
import { Logo } from "@/shared/ui";
import { AccountNav } from "@/widgets/account-shell/ui/AccountNav";

/**
 * Personal account: its own layout without the site header and footer — a side menu on desktop,
 * a bottom tab bar on phones.
 */
export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser(routes.account);
  const staff = Boolean(user.is_staff);

  // Managers and admins work in the admin panel; here they only keep their password and sessions.
  if (staff && (await headers()).get("x-pathname") !== routes.accountSettings) redirect(routes.admin);

  const [{ t }, dashboard] = await Promise.all([
    getI18n(),
    staff ? null : userFetch<{ data: { unread_notifications_count: number } }>("/me/dashboard"),
  ]);
  const unread = dashboard?.data.unread_notifications_count ?? 0;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href={routes.home} aria-label={t.header.homeAria}>
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href={routes.home} className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex">
              <ArrowLeft className="size-4" />
              {t.acc.nav.toSite}
            </Link>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:pb-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-extrabold text-brand ring-2 ring-brand ring-offset-2 ring-offset-surface">
                {user.name.charAt(0)}
              </span>
              <span className="min-w-0">
                <b className="block truncate">{user.name}</b>
                <span className="block truncate text-xs text-muted-foreground">{user.phone ? formatPhone(user.phone) : user.email}</span>
              </span>
            </div>
            <AccountNav unread={unread} staff={staff} variant="side" />
            <LogoutButton />
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <AccountNav unread={unread} staff={staff} variant="bottom" />
    </div>
  );
}
