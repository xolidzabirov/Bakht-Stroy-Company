import { ShieldCheck } from "lucide-react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/**
 * Who is signed in: the dark band with the brand stripes, the same for customers and the shop team.
 * `facts` are short lines with an icon (email, phone, date); `action` sits on the right (a logout button).
 */
export function ProfileBand({ name, role, label, facts, action }: { name: string; role: string; label: string; facts: { icon: React.ComponentType<{ className?: string }>; text: string }[]; action?: React.ReactNode }) {
  return (
    <section aria-label={label} className="relative overflow-hidden rounded-2xl bg-ink text-white dark:ring-1 dark:ring-white/10">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--brand) 0 2px, transparent 2px 28px)" }} />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand text-2xl font-bold text-ink ring-4 ring-white/10 sm:size-20 sm:text-3xl">{initials(name)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="min-w-0 truncate text-xl font-bold tracking-tight sm:text-2xl">{name}</p>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-brand">
              <ShieldCheck className="size-3.5" />
              {role}
            </span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/65">
            {facts.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex min-w-0 items-center gap-1.5">
                <Icon className="size-4 shrink-0" />
                <span className="truncate tabular-nums">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        {action}
      </div>
    </section>
  );
}
