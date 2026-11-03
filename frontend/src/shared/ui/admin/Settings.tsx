import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "../Button";

/*
 * Settings pages of the admin panel: values read as plain text; "Изменить" turns one section into a form in place.
 * The section being edited gets the yellow edge of the active menu item and its own Cancel / Save bar,
 * so it is always clear what is being changed and how to leave.
 */

type SectionProps = {
  id: string;
  title: string;
  /** What the section holds and where customers see it. */
  description?: string;
  editing?: boolean;
  /** Usually <EditButton>; hidden while editing — the footer takes over. */
  action?: React.ReactNode;
  /** The Cancel / Save bar while editing. */
  footer?: React.ReactNode;
  /** No space under the content: it ends with its own full-width bar (an inline editor). */
  flush?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSection({ id, title, description, editing = false, action, footer, flush = false, children, className }: SectionProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface transition-[border-color,box-shadow] duration-200",
        editing ? "border-foreground/25 shadow-[0_12px_32px_-16px_rgba(16,24,40,0.28)]" : "border-border shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px] bg-brand transition-opacity duration-200", editing ? "opacity-100" : "opacity-0")} />
      <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-[15px] font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {!editing && action}
      </header>
      <div className={cn("px-5 sm:px-6", !flush && "pb-2")}>{children}</div>
      {editing && footer}
    </section>
  );
}

/** Label → value rows. */
export function SettingsList({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-border">{children}</dl>;
}

type RowProps = {
  label: string;
  /** In edit mode the label points at its input. */
  htmlFor?: string;
  /** A trailing action of the row ("Сменить" for the password). */
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingRow({ label, htmlFor, action, children }: RowProps) {
  return (
    <div className="grid gap-1.5 py-3.5 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] sm:items-baseline sm:gap-5">
      <dt className="text-sm text-muted-foreground">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="font-medium text-foreground">
            {label}
          </label>
        ) : (
          label
        )}
      </dt>
      <dd className="flex min-w-0 items-start justify-between gap-3 text-sm text-foreground">
        <div className="min-w-0 flex-1">{children}</div>
        {action}
      </dd>
    </div>
  );
}

/** "Не указано" with an optional "Добавить" that opens the section right on this field. */
export function EmptyValue({ text, addLabel, onAdd }: { text: string; addLabel?: string; onAdd?: () => void }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-muted-foreground">{text}</span>
      {onAdd && addLabel && (
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-md font-medium text-foreground underline decoration-border underline-offset-4 transition hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <Plus className="size-3.5" />
          {addLabel}
        </button>
      )}
    </span>
  );
}

/** "Изменить" in the section header; off while another section is being edited (with the reason in the tooltip). */
export function EditButton({
  label,
  onClick,
  disabled,
  disabledReason,
  buttonRef,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  /** To bring the focus back here when the section closes. */
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <Button ref={buttonRef} type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled} title={disabled ? disabledReason : undefined} className="shrink-0">
      <Pencil className="size-3.5" />
      {label}
    </Button>
  );
}

/** Cancel / Save under the section being edited. The save button submits the surrounding form. */
export function EditFooter({ cancelLabel, saveLabel, onCancel, saving, error }: { cancelLabel: string; saveLabel: string; onCancel: () => void; saving: boolean; error?: string | null }) {
  return (
    <div className="border-t border-border bg-muted/40 px-5 py-3 sm:px-6">
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          {cancelLabel}
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving && <LoaderCircle className="size-4 animate-spin" />}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
