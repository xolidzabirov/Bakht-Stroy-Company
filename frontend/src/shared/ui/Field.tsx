"use client";

import { type ComponentProps, type ReactNode, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";

export const inputClasses =
  "h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/25 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

type FieldProps = {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Text or link on the right of the label ("Забыли пароль?"). */
  aside?: ReactNode;
  children: (id: string, describedBy: string | undefined) => ReactNode;
};

/**
 * Label + control + error/hint. The error replaces the hint, so the form does not jump.
 */
export function Field({ label, error, hint, aside, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {aside}
      </div>
      {children(id, error || hint ? messageId : undefined)}
      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <div id={messageId} className="mt-1.5 text-xs text-muted">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

/** Password with a "show" eye button. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={cn(inputClasses, "pr-12", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}

/** Banner above a form: error from the server or a success note. */
export function FormAlert({ tone = "danger", children }: { tone?: "danger" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        tone === "danger" && "bg-danger/10 text-danger",
        tone === "success" && "bg-success/10 text-success",
        tone === "info" && "bg-brand-soft text-foreground",
      )}
    >
      {children}
    </div>
  );
}
