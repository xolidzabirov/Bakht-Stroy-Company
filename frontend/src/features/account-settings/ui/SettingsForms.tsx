"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { LoaderCircle, LogOut, MonitorSmartphone, Trash2 } from "lucide-react";
import { newPasswordSchema } from "@/features/auth/model/schemas";
import { PasswordStrength } from "@/features/auth/ui/PasswordStrength";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { Session } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Button, Field, FormAlert, PasswordInput } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

function Section({ title, children, danger = false }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={cn("rounded-2xl border bg-surface p-5 sm:p-6", danger ? "border-destructive/40" : "border-border")}>
      <h2 className={cn("mb-4 text-lg font-extrabold", danger && "text-destructive")}>{title}</h2>
      {children}
    </section>
  );
}

/* ---------- Profile ---------- */

export function PasswordForm() {
  const { t } = useI18n();
  const s = t.acc.settings;
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z
        .object({ current_password: z.string().min(1, t.auth.validation.passwordRequired), password: newPasswordSchema(t), password_confirmation: z.string() })
        .refine((data) => data.password === data.password_confirmation, { path: ["password_confirmation"], message: t.auth.validation.mismatch }),
    [t],
  );
  const {
    register,
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ current_password: string; password: string; password_confirmation: string }>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await bff("/api/proxy/me/password", { method: "PUT", body: values });
      toast.success(s.passwordChanged);
      reset();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["current_password", "password", "password_confirmation"], t.errors));
    }
  });

  return (
    <Section title={s.password}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {formError && <div className="sm:col-span-2"><FormAlert>{formError}</FormAlert></div>}
        <div className="sm:col-span-2 sm:max-w-sm">
          <Field label={s.currentPassword} error={errors.current_password?.message}>
            {(id, describedBy) => <PasswordInput id={id} autoComplete="current-password" aria-invalid={Boolean(errors.current_password)} aria-describedby={describedBy} {...register("current_password")} />}
          </Field>
        </div>
        <Field label={s.newPassword} error={errors.password?.message}>
          {(id, describedBy) => (
            <>
              <PasswordInput id={id} autoComplete="new-password" placeholder={t.auth.newPasswordPlaceholder} aria-invalid={Boolean(errors.password)} aria-describedby={describedBy} {...register("password")} />
              <PasswordStrength value={password} />
            </>
          )}
        </Field>
        <Field label={t.auth.confirmPassword} error={errors.password_confirmation?.message}>
          {(id, describedBy) => <PasswordInput id={id} autoComplete="new-password" placeholder={t.auth.confirmPlaceholder} aria-invalid={Boolean(errors.password_confirmation)} aria-describedby={describedBy} {...register("password_confirmation")} />}
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            {s.changePassword}
          </Button>
        </div>
      </form>
    </Section>
  );
}

/* ---------- Sessions ---------- */

export function SessionsList({ sessions }: { sessions: Session[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const s = t.acc.settings;
  const [busy, setBusy] = useState<number | null>(null);

  const end = async (id: number) => {
    setBusy(id);
    try {
      await bff(`/api/proxy/me/sessions/${id}`, { method: "DELETE" });
      toast.success(s.sessionEnded);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Section title={s.sessions}>
      <ul className="divide-y divide-border">
        {sessions.map((session) => (
          <li key={session.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <MonitorSmartphone className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 text-sm">
              <b className="block truncate">{session.device}</b>
              <span className="text-muted-foreground">
                {session.is_current ? s.thisDevice : session.last_used_at ? fmt(s.lastActive, { date: formatDate(session.last_used_at, locale) }) : s.neverActive}
              </span>
            </span>
            {session.is_current ? (
              <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">{s.thisDevice}</span>
            ) : (
              <Button variant="ghost" size="sm" disabled={busy === session.id} onClick={() => end(session.id)}>
                {busy === session.id ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                {s.endSession}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------- Delete account ---------- */

export function DeleteAccount() {
  const { t } = useI18n();
  const s = t.acc.settings;
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const remove = async () => {
    setPending(true);
    setError(null);
    try {
      await bff("/api/proxy/me", { method: "DELETE", body: { password } });
      // The token is gone with the account — clear the cookies and leave.
      window.location.href = "/api/auth/logout";
    } catch (failure) {
      setError(failure instanceof ApiError ? (failure.errors?.password?.[0] ?? failure.message) : t.errors.generic);
      setPending(false);
    }
  };

  return (
    <Section title={s.danger} danger>
      <p className="text-sm text-muted-foreground">{s.deleteText}</p>
      <Button variant="outline" className="mt-4 text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
        {s.deleteAccount}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{s.deleteTitle}</DialogTitle>
          <DialogDescription>{s.deleteConfirm}</DialogDescription>
          {error && <FormAlert>{error}</FormAlert>}
          <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.auth.passwordPlaceholder} autoComplete="current-password" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {s.cancel}
            </Button>
            <Button className="bg-destructive text-white hover:bg-destructive/90" disabled={pending || !password} onClick={remove}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {s.deleteAccount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
