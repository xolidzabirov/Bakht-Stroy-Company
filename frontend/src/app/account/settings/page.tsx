import type { Metadata } from "next";
import { DeleteAccount, EmailForm, PasswordForm, ProfileForm, SessionsList } from "@/features/account-settings/ui/SettingsForms";
import { requireUser } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Session } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.acc.settings.title, robots: { index: false } };
}

/** Profile, sign-in email, password, devices and account removal. */
export default async function AccountSettingsPage() {
  const [user, { t }, sessions] = await Promise.all([requireUser(routes.accountSettings), getI18n(), userFetch<{ data: Session[] }>("/me/sessions")]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">{t.acc.settings.title}</h1>
      <ProfileForm name={user.name} phone={user.phone} phoneVerified={Boolean(user.phone_verified_at)} />
      <EmailForm email={user.email} />
      <PasswordForm />
      <SessionsList sessions={sessions.data} />
      <DeleteAccount />
    </div>
  );
}
