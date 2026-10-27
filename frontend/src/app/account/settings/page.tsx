import type { Metadata } from "next";
import { DeleteAccount, PasswordForm, SessionsList } from "@/features/account-settings/ui/SettingsForms";
import { LocaleSwitcher } from "@/features/preferences/ui/LocaleSwitcher";
import { ThemeToggle } from "@/features/preferences/ui/ThemeToggle";
import { requireUser } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Session } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.acc.settings.title, robots: { index: false } };
}

/** Security and preferences: password, language and theme, devices, account removal. Profile data lives on /account/profile. */
export default async function AccountSettingsPage() {
  const [user, { t }, sessions] = await Promise.all([requireUser(routes.accountSettings), getI18n(), userFetch<{ data: Session[] }>("/me/sessions")]);
  const s = t.acc.settings;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">{s.title}</h1>
      <PasswordForm />
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">{s.appearance}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{s.appearanceText}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </section>
      <SessionsList sessions={sessions.data} />
      {/* Staff accounts are never removed by their owner (the API refuses too). */}
      {!user.is_staff && <DeleteAccount />}
    </div>
  );
}
