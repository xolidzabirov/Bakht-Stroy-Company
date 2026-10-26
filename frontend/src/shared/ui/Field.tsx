"use client";

import { type ComponentProps, type ReactNode, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { Input } from "./kit/input";
import { Label } from "./kit/label";

type FieldProps = {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Text or link on the right of the label ("Забыли пароль?"). */
  aside?: ReactNode;
  children: (id: string, describedBy: string | undefined) => ReactNode;
};

/**
 * Label + control + error/hint (shadcn/ui Label and Input). The error replaces the hint, so the form does not jump.
 */
export function Field({ label, error, hint, aside, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <Label htmlFor={id} className="font-semibold">
          {label}
        </Label>
        {aside}
      </div>
      {children(id, error || hint ? messageId : undefined)}
      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <div id={messageId} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <Input {...props} />;
}

/** Password with a "show" eye button. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-12", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "success" && "bg-success/10 text-success",
        tone === "info" && "bg-brand-soft text-foreground",
      )}
    >
      {children}
    </div>
  );
}
