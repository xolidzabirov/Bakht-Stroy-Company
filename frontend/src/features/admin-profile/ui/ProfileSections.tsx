"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeCheck, LoaderCircle, LogOut, Monitor, Smartphone } from "lucide-react";
import { newPasswordSchema } from "@/features/auth/model/schemas";
import { PasswordStrength } from "@/features/auth/ui/PasswordStrength";
import { readTheme, saveLocale, setTheme } from "@/features/preferences/model/preferences";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { Session } from "@/shared/api/types";
import { localeNames, locales, type Locale, type Theme, themes } from "@/shared/i18n/config";
import { useAdminI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPhone } from "@/shared/lib/format";
import { Button, PasswordInput, TextInput } from "@/shared/ui";
import { EditButton, EditFooter, EmptyValue, SettingRow, SettingsList, SettingsSection } from "@/shared/ui/admin/Settings";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

/** Error text under an input, linked to it for screen readers. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-destructive">
      {message}
    </p>
  );
}

function Verified({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold text-success">
      <BadgeCheck className="size-3.5" />
      {label}
    </span>
  );
}

/** Brings the focus back to the "Изменить" button when a section closes. */
function useReturnFocus(open: boolean) {
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (wasOpen.current && !open) button.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return button;
}

/* ---------- Name and phone ---------- */

export function PersonalSection({ name, phone, phoneVerified }: { name: string; phone: string | null; phoneVerified: boolean }) {
  const { t } = useAdminI18n();
  const p = t.admin.profile;
  const c = t.admin.common;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const editButton = useReturnFocus(editing);
  const defaults = { name, phone: phone ? formatPhone(phone) : "" };
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string; phone: string }>({ defaultValues: defaults });

  useEffect(() => {
    if (editing) setFocus("name");
  }, [editing, setFocus]);

  const cancel = () => {
    reset(defaults);
    setFormError(null);
    setEditing(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { data } = await bff<{ data: { name: string; phone: string | null } }>("/api/proxy/me", {
        method: "PATCH",
        body: { name: values.name.trim(), phone: values.phone.replace(/[^\d+]/g, "") || null },
      });
      reset({ name: data.name, phone: data.phone ? formatPhone(data.phone) : "" });
      setEditing(false);
      toast.success(p.saved);
      router.refresh();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["name", "phone"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection
        id="profile-personal"
        title={p.personal}
        description={p.personalText}
        editing={editing}
        action={<EditButton buttonRef={editButton} label={c.edit} onClick={() => setEditing(true)} />}
        footer={<EditFooter cancelLabel={c.cancel} saveLabel={c.save} onCancel={cancel} saving={isSubmitting} error={formError} />}
      >
        <SettingsList>
          {editing ? (
            <>
              <SettingRow label={p.name} htmlFor="profile-name">
                <TextInput
                  id="profile-name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "profile-name-error" : undefined}
                  {...register("name", { required: t.admin.common.required, minLength: { value: 2, message: t.admin.common.required } })}
                />
                <FieldError id="profile-name-error" message={errors.name?.message} />
              </SettingRow>
              <SettingRow label={p.phone} htmlFor="profile-phone">
                <TextInput
                  id="profile-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+992 90 766 66 09"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "profile-phone-error" : "profile-phone-hint"}
                  {...register("phone")}
                />
                <FieldError id="profile-phone-error" message={errors.phone?.message} />
                {!errors.phone && (
                  <p id="profile-phone-hint" className="mt-1.5 text-xs text-muted-foreground">
                    {p.phoneHint}
                  </p>
                )}
              </SettingRow>
            </>
          ) : (
            <>
              <SettingRow label={p.name}>
                <span className="font-medium">{name}</span>
              </SettingRow>
              <SettingRow label={p.phone}>
                {phone ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span className="tabular-nums">{formatPhone(phone)}</span>
                    {phoneVerified && <Verified label={p.verified} />}
                  </span>
                ) : (
                  <EmptyValue text={p.notSet} addLabel={p.add} onAdd={() => setEditing(true)} />
                )}
              </SettingRow>
            </>
          )}
        </SettingsList>
      </SettingsSection>
    </form>
  );
}

/* ---------- Email and password ---------- */

type SignInEditing = "email" | "password" | null;

export function SignInSection({ email, emailVerified }: { email: string; emailVerified: boolean }) {
  const { t } = useAdminI18n();
  const p = t.admin.profile;
  const [editing, setEditing] = useState<SignInEditing>(null);
  const emailButton = useReturnFocus(editing === "email");
  const passwordButton = useReturnFocus(editing === "password");

  // Each row opens its own small form in place; the other row waits until it closes.
  return (
    <SettingsSection id="profile-sign-in" title={p.signIn} description={p.signInText} editing={editing !== null} flush={editing === "password"}>
      {editing === "email" ? (
        <EmailEditor email={email} onDone={() => setEditing(null)} />
      ) : (
        <SettingsList>
          <SettingRow label={p.email} action={editing === null && <RowButton buttonRef={emailButton} label={p.changeEmail} onClick={() => setEditing("email")} />}>
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="break-all">{email}</span>
              {emailVerified && <Verified label={p.verified} />}
            </span>
          </SettingRow>
        </SettingsList>
      )}

      {editing === "password" ? (
        <div className="border-t border-border">
          <PasswordEditor email={email} onDone={() => setEditing(null)} />
        </div>
      ) : (
        <div className={cn(editing !== "email" && "border-t border-border")}>
          <SettingsList>
            <SettingRow
              label={p.password}
              action={editing === null && <RowButton buttonRef={passwordButton} label={p.changePassword} onClick={() => setEditing("password")} />}
            >
              <span className="sr-only">{p.passwordHidden}</span>
              <span aria-hidden className="select-none tracking-[0.25em] text-muted-foreground">
                ••••••••••
              </span>
            </SettingRow>
          </SettingsList>
        </div>
      )}
    </SettingsSection>
  );
}

function RowButton({ label, onClick, buttonRef }: { label: string; onClick: () => void; buttonRef?: React.Ref<HTMLButtonElement> }) {
  return (
    <Button ref={buttonRef} type="button" variant="outline" size="sm" onClick={onClick} className="shrink-0">
      {label}
    </Button>
  );
}

/** New email → a code to that address → the code and the current password. */
function EmailEditor({ email, onDone }: { email: string; onDone: () => void }) {
  const { t } = useAdminI18n();
  const p = t.admin.profile;
  const c = t.admin.common;
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; code: string; password: string }>({ defaultValues: { email: "", code: "", password: "" } });

  useEffect(() => {
    setFocus(sentTo ? "code" : "email");
  }, [sentTo, setFocus]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (!sentTo) {
        await bff("/api/proxy/me/email/send-code", { body: { email: values.email.trim() } });
        setSentTo(values.email.trim());
        return;
      }
      await bff("/api/proxy/me/email", { method: "PUT", body: { email: sentTo, code: values.code.trim(), password: values.password } });
      toast.success(p.emailChanged);
      onDone();
      router.refresh();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["email", "code", "password"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="-mx-5 sm:-mx-6">
      <div className="px-5 sm:px-6">
        <SettingsList>
          {!sentTo ? (
            <>
              <SettingRow label={p.email}>
                <span className="break-all text-muted-foreground">{email}</span>
              </SettingRow>
              <SettingRow label={p.newEmail} htmlFor="profile-new-email">
                <TextInput
                  id="profile-new-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={t.auth.emailPlaceholder}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "profile-new-email-error" : "profile-new-email-hint"}
                  {...register("email", { required: t.admin.common.required })}
                />
                <FieldError id="profile-new-email-error" message={errors.email?.message} />
                {!errors.email && (
                  <p id="profile-new-email-hint" className="mt-1.5 text-xs text-muted-foreground">
                    {p.newEmailHint}
                  </p>
                )}
              </SettingRow>
            </>
          ) : (
            <>
              <SettingRow label={p.newEmail}>
                <span className="break-all font-medium">{sentTo}</span>
                <span role="status" className="mt-1 block text-xs text-muted-foreground">
                  {fmt(p.codeSentTo, { email: sentTo })}
                </span>
              </SettingRow>
              <SettingRow label={p.code} htmlFor="profile-email-code">
                <TextInput
                  id="profile-email-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="••••••"
                  className="max-w-40 tracking-[0.3em]"
                  aria-invalid={Boolean(errors.code)}
                  aria-describedby={errors.code ? "profile-email-code-error" : undefined}
                  {...register("code", { required: t.admin.common.required })}
                />
                <FieldError id="profile-email-code-error" message={errors.code?.message} />
              </SettingRow>
              <SettingRow label={p.currentPassword} htmlFor="profile-email-password">
                <PasswordInput
                  id="profile-email-password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "profile-email-password-error" : undefined}
                  {...register("password", { required: t.admin.common.required })}
                />
                <FieldError id="profile-email-password-error" message={errors.password?.message} />
              </SettingRow>
            </>
          )}
        </SettingsList>
      </div>
      <EditFooter cancelLabel={c.cancel} saveLabel={sentTo ? p.confirmEmail : p.sendCode} onCancel={onDone} saving={isSubmitting} error={formError} />
    </form>
  );
}

function PasswordEditor({ email, onDone }: { email: string; onDone: () => void }) {
  const { t } = useAdminI18n();
  const p = t.admin.profile;
  const c = t.admin.common;
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z
        .object({ current_password: z.string().min(1, t.auth.validation.passwordRequired), password: newPasswordSchema(t, email), password_confirmation: z.string() })
        .refine((data) => data.password === data.password_confirmation, { path: ["password_confirmation"], message: t.auth.validation.mismatch }),
    [t, email],
  );
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<{ current_password: string; password: string; password_confirmation: string }>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });
  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    setFocus("current_password");
  }, [setFocus]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await bff("/api/proxy/me/password", { method: "PUT", body: values });
      toast.success(p.passwordChanged);
      onDone();
      // Other devices were signed out — the list below changes.
      router.refresh();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["current_password", "password", "password_confirmation"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="-mx-5 sm:-mx-6">
      <div className="px-5 sm:px-6">
        <SettingsList>
          <SettingRow label={p.currentPassword} htmlFor="profile-current-password">
            <PasswordInput
              id="profile-current-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.current_password)}
              aria-describedby={errors.current_password ? "profile-current-password-error" : undefined}
              {...register("current_password")}
            />
            <FieldError id="profile-current-password-error" message={errors.current_password?.message} />
          </SettingRow>
          <SettingRow label={p.newPassword} htmlFor="profile-new-password">
            <PasswordInput
              id="profile-new-password"
              autoComplete="new-password"
              placeholder={t.auth.newPasswordPlaceholder}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "profile-new-password-error" : undefined}
              {...register("password")}
            />
            <PasswordStrength value={password} email={email} />
            <FieldError id="profile-new-password-error" message={errors.password?.message} />
          </SettingRow>
          <SettingRow label={p.confirmPassword} htmlFor="profile-confirm-password">
            <PasswordInput
              id="profile-confirm-password"
              autoComplete="new-password"
              placeholder={t.auth.confirmPlaceholder}
              aria-invalid={Boolean(errors.password_confirmation)}
              aria-describedby={errors.password_confirmation ? "profile-confirm-password-error" : "profile-password-note"}
              {...register("password_confirmation")}
            />
            <FieldError id="profile-confirm-password-error" message={errors.password_confirmation?.message} />
            {!errors.password_confirmation && (
              <p id="profile-password-note" className="mt-1.5 text-xs text-muted-foreground">
                {p.passwordNote}
              </p>
            )}
          </SettingRow>
        </SettingsList>
      </div>
      <EditFooter cancelLabel={c.cancel} saveLabel={p.changePassword} onCancel={onDone} saving={isSubmitting} error={formError} />
    </form>
  );
}

/* ---------- Language and theme ---------- */

/** Radio buttons drawn as a segmented control: arrow keys move the choice, like any radio group. */
function Segmented<T extends string>({ name, legend, value, options, onChange }: { name: string; legend: string; value: T | null; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
              value === option.value ? "bg-surface text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="sr-only" />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const noop = () => () => {};

export function AppearanceSection() {
  const { t, locale } = useAdminI18n();
  const p = t.admin.profile;
  // The saved theme lives in a cookie: read in the browser only (the server does not know it).
  const savedTheme = useSyncExternalStore(noop, readTheme, () => null);
  const [theme, setThemeChoice] = useState<Theme | null>(null);
  const [switching, setSwitching] = useState(false);

  const chooseLocale = (next: Locale) => {
    if (next === locale) return;
    saveLocale(next);
    setSwitching(true);
    window.location.reload();
  };

  const chooseTheme = (next: Theme) => {
    setTheme(next);
    setThemeChoice(next);
  };

  return (
    <SettingsSection id="profile-appearance" title={p.appearance} description={p.appearanceText}>
      <SettingsList>
        <SettingRow label={p.language}>
          <div className={cn(switching && "pointer-events-none opacity-60")}>
            <Segmented name="locale" legend={p.language} value={locale} options={locales.map((item) => ({ value: item, label: localeNames[item].name }))} onChange={chooseLocale} />
          </div>
        </SettingRow>
        <SettingRow label={p.theme}>
          <Segmented name="theme" legend={p.theme} value={theme ?? savedTheme} options={themes.map((item) => ({ value: item, label: p.themes[item] }))} onChange={chooseTheme} />
        </SettingRow>
      </SettingsList>
    </SettingsSection>
  );
}

/* ---------- Devices ---------- */

const PREVIEW = 4;
const isPhone = (device: string) => /android|iphone|ipad|mobile/i.test(device);

export function SessionsSection({ sessions }: { sessions: Session[] }) {
  const { t, locale } = useAdminI18n();
  const p = t.admin.profile;
  const c = t.admin.common;
  const router = useRouter();
  const [busy, setBusy] = useState<number | "others" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const current = sessions.find((session) => session.is_current);
  const others = sessions.filter((session) => !session.is_current);
  const shown = expanded ? others : others.slice(0, PREVIEW);

  const fail = (error: unknown) => toast.error(error instanceof ApiError ? error.message : t.errors.generic);

  const end = async (id: number) => {
    setBusy(id);
    try {
      await bff(`/api/proxy/me/sessions/${id}`, { method: "DELETE" });
      toast.success(p.ended);
      router.refresh();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  };

  const endOthers = async () => {
    setBusy("others");
    try {
      const { ended } = await bff<{ ended: number }>("/api/proxy/me/sessions", { method: "DELETE" });
      toast.success(fmt(p.endedOthers, { count: String(ended) }));
      setConfirming(false);
      router.refresh();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  };

  const line = (session: Session) => {
    const Icon = isPhone(session.device) ? Smartphone : Monitor;
    return (
      <li key={session.id} className="flex items-center gap-3 py-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", session.is_current ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
          <Icon className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="block truncate font-medium">{session.device}</span>
          <span className="block text-xs text-muted-foreground">
            {session.is_current ? p.thisDeviceNow : session.last_used_at ? fmt(p.lastActive, { date: formatDate(session.last_used_at, locale) }) : p.neverActive}
          </span>
        </span>
        {session.is_current ? (
          <span className="shrink-0 rounded-md bg-success/10 px-2 py-1 text-xs font-semibold text-success">{p.thisDevice}</span>
        ) : (
          <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => void end(session.id)} aria-label={`${p.end}: ${session.device}`}>
            {busy === session.id ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            <span className="hidden sm:inline">{p.end}</span>
          </Button>
        )}
      </li>
    );
  };

  return (
    <SettingsSection
      id="profile-devices"
      title={p.devices}
      description={p.devicesText}
      action={
        others.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)} disabled={busy !== null} className="shrink-0">
            <LogOut className="size-3.5" />
            {p.endOthers}
          </Button>
        )
      }
    >
      <ul className="divide-y divide-border">
        {current && line(current)}
        {shown.map(line)}
      </ul>
      {others.length === 0 && <p className="pb-3 text-sm text-muted-foreground">{p.noOthers}</p>}
      {others.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mb-3 mt-1 rounded-md text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          {expanded ? p.showLess : fmt(p.showAll, { count: String(others.length) })}
        </button>
      )}

      <Dialog open={confirming} onOpenChange={(next) => busy === null && setConfirming(next)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">{p.endOthersTitle}</DialogTitle>
          <DialogDescription>{fmt(p.endOthersText, { count: String(others.length) })}</DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy !== null}>
              {c.cancel}
            </Button>
            <Button onClick={() => void endOthers()} disabled={busy !== null} className="bg-destructive text-white hover:bg-destructive/90">
              {busy === "others" && <LoaderCircle className="size-4 animate-spin" />}
              {p.endOthers}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
