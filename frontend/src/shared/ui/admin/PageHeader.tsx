import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type IconType = React.ComponentType<{ className?: string }>;

/** Title row of an admin page: optional "← back" link, the section icon, title, short description and action buttons. */
export function PageHeader({
  title,
  description,
  back,
  actions,
  icon: Icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  icon?: IconType;
}) {
  return (
    <header className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          {Icon && (
            <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-ink text-brand shadow-sm ring-1 ring-black/5 sm:grid dark:bg-surface-muted dark:ring-white/10">
              <Icon className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** "Nothing here yet" block for empty lists. */
export function EmptyState({ icon: Icon, title, text, action }: { icon: IconType; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-muted ring-8 ring-muted/40">
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <p className="mt-5 font-display text-lg font-bold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** White card with an optional header bar (title on the left, actions on the right) — the building block of admin pages. */
export function Panel({ title, actions, children, className = "" }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]", className)}>
      {(title || actions) && (
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          {title && <h2 className="font-display text-[15px] font-bold tracking-tight">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
