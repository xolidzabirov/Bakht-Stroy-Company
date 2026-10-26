"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { applyApiErrors, bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { Button, Field, FormAlert, PasswordInput, TextInput } from "@/shared/ui";
import { type LoginValues, createAuthSchemas } from "../model/schemas";

type Props = {
  /** Where to go after signing in (already checked by safeNext). */
  next: string;
  notice?: string;
};

export function LoginForm({ next, notice }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createAuthSchemas(t).login, [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", remember: true } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await bff("/api/auth/login", { body: values });
      router.replace(next);
      router.refresh();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["email", "password"], t.errors));
    }
  });

  const query = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label={t.auth.email} error={errors.email?.message}>
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

      <Field
        label={t.auth.password}
        error={errors.password?.message}
        aside={
          <Link href={`${routes.forgotPassword}${query}`} className="text-sm font-medium text-muted hover:text-foreground">
            {t.auth.forgotLink}
          </Link>
        }
      >
        {(id, describedBy) => (
          <PasswordInput
            id={id}
            autoComplete="current-password"
            placeholder={t.auth.passwordPlaceholder}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy}
            {...register("password")}
          />
        )}
      </Field>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="size-5 rounded accent-brand" {...register("remember")} />
        {t.auth.remember}
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        {t.auth.submitLogin}
        {!isSubmitting && <ArrowRight className="size-5" />}
      </Button>

      <p className="text-center text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href={`${routes.register}${query}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
          {t.auth.createAccount}
        </Link>
      </p>
    </form>
  );
}
