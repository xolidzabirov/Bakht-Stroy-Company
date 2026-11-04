import type { Metadata } from "next";
import { CalendarDays, Mail, UserRound } from "lucide-react";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { AppearanceSection, PersonalSection, SessionsSection, SignInSection } from "@/features/admin-profile/ui/ProfileSections";
import { isAdmin, requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Session } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { ProfileBand } from "@/shared/ui/ProfileBand";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.profile.title };
}

/**
 * The signed-in manager or administrator: who they are, then their name and phone, sign-in email and password,
 * language and theme, and the devices with access — each part reads as text and opens for editing in place.
 */
export default async function AdminProfilePage() {
  const [user, { t, locale }, sessions] = await Promise.all([requireStaff(routes.adminProfile), getI18n(), userFetch<{ data: Session[] }>("/me/sessions")]);
  const p = t.admin.profile;
  const role = t.acc.profile.roles[isAdmin(user) ? "admin" : "manager"];

  return (
    <div>
      <PageHeader icon={UserRound} title={p.title} description={p.lead} />

      <ProfileBand
        name={user.name}
        role={role}
        label={p.title}
        facts={[
          { icon: Mail, text: user.email },
          { icon: CalendarDays, text: fmt(p.inTeam, { date: formatDate(user.created_at, locale) }) },
        ]}
        action={<LogoutButton className="shrink-0 self-start border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white sm:self-center" />}
      />

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-2 [&>*]:min-w-0">
        <div className="space-y-5">
          <PersonalSection name={user.name} phone={user.phone ?? null} phoneVerified={Boolean(user.phone_verified_at)} />
          <SignInSection email={user.email} emailVerified={Boolean(user.email_verified_at)} />
        </div>
        <div className="space-y-5">
          <AppearanceSection />
          <SessionsSection sessions={sessions.data} />
        </div>
      </div>
    </div>
  );
}
