import type { Metadata } from "next";
import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import { AppearanceSection, PersonalSection, SessionsSection, SignInSection } from "@/features/admin-profile/ui/ProfileSections";
import { isAdmin, requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Session } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.profile.title };
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

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

      {/* Who is signed in: the dark band with the brand stripes, like the rest of the panel's identity. */}
      <section aria-label={p.title} className="relative overflow-hidden rounded-2xl bg-ink text-white dark:ring-1 dark:ring-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--brand) 0 2px, transparent 2px 28px)" }} />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand text-2xl font-bold text-ink ring-4 ring-white/10 sm:size-20 sm:text-3xl">{initials(user.name)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="truncate text-xl font-bold tracking-tight sm:text-2xl">{user.name}</p>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-brand">
                <ShieldCheck className="size-3.5" />
                {role}
              </span>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/65">
              <li className="inline-flex min-w-0 items-center gap-1.5">
                <Mail className="size-4 shrink-0" />
                <span className="truncate">{user.email}</span>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 shrink-0" />
                {fmt(p.inTeam, { date: formatDate(user.created_at, locale) })}
              </li>
            </ul>
          </div>
        </div>
      </section>

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
