import type { Metadata } from "next";
import { CalendarDays, Mail, Phone } from "lucide-react";
import { PersonalSection, SignInSection } from "@/features/admin-profile/ui/ProfileSections";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { I18nProvider } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatDate, formatPhone } from "@/shared/lib/format";
import { ProfileBand } from "@/shared/ui/ProfileBand";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.acc.profile.title, robots: { index: false } };
}

/**
 * Who I am: the band with the name and contacts, then the data as plain text. "Изменить" opens one part as a form in place,
 * the same as in the staff profile (those sections read their texts from the whole dictionary, given here).
 */
export default async function AccountProfilePage() {
  const [user, { t, locale }] = await Promise.all([requireUser(routes.accountProfile), getI18n()]);
  const p = t.acc.profile;
  const role = (user.roles ?? []).includes("admin") ? "admin" : (user.roles ?? []).includes("manager") ? "manager" : "client";

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">{p.title}</h1>

      <ProfileBand
        name={user.name}
        role={p.roles[role]}
        label={p.title}
        facts={[
          { icon: Mail, text: user.email },
          ...(user.phone ? [{ icon: Phone, text: formatPhone(user.phone) }] : []),
          { icon: CalendarDays, text: fmt(p.since, { date: formatDate(user.created_at, locale) }) },
        ]}
      />

      <I18nProvider locale={locale} dictionary={t}>
        <PersonalSection name={user.name} phone={user.phone ?? null} phoneVerified={Boolean(user.phone_verified_at)} description={p.personalText} />
        <SignInSection email={user.email} emailVerified={Boolean(user.email_verified_at)} description={p.signInText} />
      </I18nProvider>
    </div>
  );
}
