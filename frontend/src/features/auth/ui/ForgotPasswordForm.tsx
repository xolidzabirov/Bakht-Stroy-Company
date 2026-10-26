"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";
import { applyApiErrors, bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { Button, Field, FormAlert, PasswordInput, TextInput } from "@/shared/ui";
import { type EmailStepValues, type ResetValues, emailStepSchema, resetSchema } from "../model/schemas";
import { PasswordStrength } from "./PasswordStrength";

/**
 * Forgot password: 1) email → code, 2) code + new password → back to the login page.
 * The answer to step 1 is the same whether the account exists or not (no account guessing).
 */
export function ForgotPasswordForm({ next }: { next: string }) {
  const [email, setEmail] = useState<string | null>(null);

  return email ? <ResetStep email={email} next={next} onBack={() => setEmail(null)} /> : <EmailStep onSent={setEmail} />;
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailStepValues>({ resolver: zodResolver(emailStepSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);

    try {
      await bff("/api/proxy/auth/forgot-password", { body: { email } });
      onSent(email);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["email"]));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label="Email аккаунта" error={errors.email?.message} hint="Пришлём код, по которому можно задать новый пароль.">
        {(id, describedBy) => (
          <TextInput id={id} type="email" autoComplete="email" inputMode="email" placeholder="you@gmail.com" autoFocus aria-invalid={Boolean(errors.email)} aria-describedby={describedBy} {...register("email")} />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        Получить код
      </Button>
    </form>
  );
}

function ResetStep({ email, next, onBack }: { email: string; next: string; onBack: () => void }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { code: "", password: "", password_confirmation: "" } });

  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await bff("/api/proxy/auth/reset-password", { body: { ...values, email } });
      const query = new URLSearchParams({ reset: "1", ...(next !== "/" ? { next } : {}) });
      router.replace(`${routes.login}?${query}`);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["code", "password", "password_confirmation"]));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex gap-3 rounded-xl bg-brand-soft p-4 text-sm">
        <MailCheck className="size-5 shrink-0" />
        <p>
          Если аккаунт <b className="break-all">{email}</b> существует, на него пришёл код. Он действует 15 минут.
        </p>
      </div>

      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label="Код из письма" error={errors.code?.message}>
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

      <Field label="Новый пароль" error={errors.password?.message}>
        {(id, describedBy) => (
          <>
            <PasswordInput id={id} autoComplete="new-password" aria-invalid={Boolean(errors.password)} aria-describedby={describedBy} {...register("password")} />
            <PasswordStrength value={password} />
          </>
        )}
      </Field>

      <Field label="Повторите пароль" error={errors.password_confirmation?.message}>
        {(id, describedBy) => (
          <PasswordInput id={id} autoComplete="new-password" aria-invalid={Boolean(errors.password_confirmation)} aria-describedby={describedBy} {...register("password_confirmation")} />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        Сохранить пароль
      </Button>

      <button type="button" onClick={onBack} className="mx-auto flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft className="size-4" />
        Указать другой email
      </button>
    </form>
  );
}
