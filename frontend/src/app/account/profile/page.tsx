import type { Metadata } from "next";
import { BadgeCheck, CalendarDays, Mail, Phone, ShieldCheck } from "lucide-react";
import { EmailForm, ProfileForm } from "@/features/account-settings/ui/SettingsForms";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatDate, formatPhone } from "@/shared/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.acc.profile.title, robots: { index: false } };
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** Who I am: a profile card with role and contacts, then name / phone and the sign-in email. */
export default async function AccountProfilePage() {
  const [user, { t, locale }] = await Promise.all([requireUser(routes.accountProfile), getI18n()]);
  const p = t.acc.profile;
  const role = (user.roles ?? []).includes("admin") ? "admin" : (user.roles ?? []).includes("manager") ? "manager" : "client";

  const contacts = [
    { icon: Mail, value: user.email, verified: Boolean(user.email_verified_at) },
    { icon: Phone, value: user.phone ? formatPhone(user.phone) : p.noPhone, verified: Boolean(user.phone && user.phone_verified_at) },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">{p.title}</h1>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="h-20 bg-ink bg-[radial-gradient(circle_at_85%_20%,rgba(255,184,0,0.35),transparent_55%)] sm:h-24" />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4 sm:-mt-12">
            <span className="grid size-20 shrink-0 place-items-center rounded-full border-4 border-surface bg-brand font-display text-2xl font-extrabold text-on-brand sm:size-24 sm:text-3xl">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <p className="truncate text-xl font-extrabold sm:text-2xl">{user.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  {p.roles[role]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  {fmt(p.since, { date: formatDate(user.created_at, locale) })}
                </span>
              </div>
            </div>
          </div>

          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {contacts.map(({ icon: Icon, value, verified }) => (
              <li key={value} className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{value}</span>
                {verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                    <BadgeCheck className="size-4" />
                    {p.verified}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ProfileForm name={user.name} phone={user.phone} phoneVerified={Boolean(user.phone_verified_at)} />
      <EmailForm email={user.email} />
    </div>
  );
}
