"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, LoaderCircle, MailCheck } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { Button, Field, FormAlert, PasswordInput, TextInput } from "@/shared/ui";
import { type EmailStepValues, type RegisterValues, createAuthSchemas } from "../model/schemas";
import { PasswordStrength } from "./PasswordStrength";
import { secondsFromMessage, useCountdown } from "./useCountdown";

/**
 * Registration in two steps: 1) email → code to the mailbox (proves the email is real),
 * 2) code + name, phone and password → account is created and signed in.
 */
export function RegisterForm({ next }: { next: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const countdown = useCountdown();

  return email ? (
    <DetailsStep email={email} next={next} countdown={countdown} onChangeEmail={() => setEmail(null)} />
  ) : (
    <EmailStep next={next} countdown={countdown} onSent={setEmail} />
  );
}

type Countdown = ReturnType<typeof useCountdown>;

async function sendCode(email: string) {
  await bff("/api/proxy/auth/register/send-code", { body: { email } });
}

function EmailStep({ next, countdown, onSent }: { next: string; countdown: Countdown; onSent: (email: string) => void }) {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createAuthSchemas(t).emailStep, [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailStepValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);

    try {
      await sendCode(email);
      countdown.start();
      onSent(email);
    } catch (error) {
      // A code was sent a moment ago — just go to the next step and wait for it.
      if (error instanceof ApiError && error.code === "CODE_RECENTLY_SENT") {
        countdown.start(secondsFromMessage(error.message) ?? 60);
        onSent(email);
        return;
      }
      setFormError(applyApiErrors(error, setError, ["email"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label={t.auth.email} error={errors.email?.message} hint={t.auth.emailHint}>
        {(id, describedBy) => (
          <TextInput
            id={id}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t.auth.emailPlaceholder}
            autoFocus
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy}
            {...register("email")}
          />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        {t.auth.getCode}
        {!isSubmitting && <ArrowRight className="size-5" />}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.haveAccount}{" "}
        <Link href={`${routes.login}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </form>
  );
}

function DetailsStep({ email, next, countdown, onChangeEmail }: { email: string; next: string; countdown: Countdown; onChangeEmail: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const schema = useMemo(() => createAuthSchemas(t).register, [t]);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", phone: "+992 ", password: "", password_confirmation: "" },
  });
  const password = useWatch({ control, name: "password" });

  const resend = async () => {
    setFormError(null);
    setNotice(null);

    try {
      await sendCode(email);
      countdown.start();
      setNotice(t.auth.newCodeSent);
    } catch (error) {
      if (error instanceof ApiError && error.code === "CODE_RECENTLY_SENT") countdown.start(secondsFromMessage(error.message) ?? 60);
      setFormError(error instanceof ApiError ? error.message : t.auth.cantSendCode);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setNotice(null);
    const phone = values.phone.replace(/\s/g, "");

    try {
      await bff("/api/auth/register", { body: { ...values, email, phone: phone === "+992" ? "" : phone } });
      router.replace(next);
      router.refresh();
    } catch (error) {
      const message = applyApiErrors(error, setError, ["code", "name", "phone", "password", "password_confirmation"], t.errors);
      // The email was taken while the code was on its way — the only fix is another email.
      setFormError(error instanceof ApiError && error.errors?.email ? error.errors.email[0] : message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex gap-3 rounded-xl bg-brand-soft p-4 text-sm">
        <MailCheck className="size-5 shrink-0" />
        <p>
          {t.auth.codeSentStart}
          <b className="break-all">{email}</b>
          {t.auth.codeSentEnd}
        </p>
      </div>

      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field
        label={t.auth.code}
        error={errors.code?.message}
        aside={
          <button type="button" onClick={resend} disabled={countdown.left > 0} className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground">
            {countdown.left > 0 ? fmt(t.auth.resendIn, { seconds: countdown.left }) : t.auth.resend}
          </button>
        }
      >
        {(id, describedBy) => (
          <TextInput
            id={id}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="••••••"
            autoFocus
            className="text-center font-display text-2xl font-extrabold tracking-[0.5em]"
            aria-invalid={Boolean(errors.code)}
            aria-describedby={describedBy}
            {...register("code")}
          />
        )}
      </Field>

      <Field label={t.auth.name} error={errors.name?.message}>
        {(id, describedBy) => (
          <TextInput id={id} autoComplete="name" placeholder={t.auth.namePlaceholder} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy} {...register("name")} />
        )}
      </Field>

      <Field label={t.auth.phone} error={errors.phone?.message} hint={t.auth.phoneHint}>
        {(id, describedBy) => (
          <TextInput
            id={id}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder={t.auth.phonePlaceholder}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy}
            {...register("phone")}
          />
        )}
      </Field>

      <Field label={t.auth.password} error={errors.password?.message}>
        {(id, describedBy) => (
          <>
            <PasswordInput
              id={id}
              autoComplete="new-password"
              placeholder={t.auth.newPasswordPlaceholder}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={describedBy}
              {...register("password")}
            />
            <PasswordStrength value={password} />
          </>
        )}
      </Field>

      <Field label={t.auth.confirmPassword} error={errors.password_confirmation?.message}>
        {(id, describedBy) => (
          <PasswordInput
            id={id}
            autoComplete="new-password"
            placeholder={t.auth.confirmPlaceholder}
            aria-invalid={Boolean(errors.password_confirmation)}
            aria-describedby={describedBy}
            {...register("password_confirmation")}
          />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        {t.auth.createSubmit}
      </Button>

      <button type="button" onClick={onChangeEmail} className="mx-auto flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t.auth.otherEmail}
      </button>
    </form>
  );
}
