"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { applyApiErrors, bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { Button, Field, FormAlert, PasswordInput, TextInput } from "@/shared/ui";
import { Checkbox } from "@/shared/ui/kit/checkbox";
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", remember: true } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const { data } = await bff<{ data: { user: { is_staff?: boolean } } }>("/api/auth/login", { body: values });
      // The shop team works in the admin panel: without a specific page to return to, go straight there.
      const staffHome = data.user.is_staff && (next === routes.home || next.startsWith(routes.account));
      router.replace(staffHome ? routes.admin : next);
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
          <Link href={`${routes.forgotPassword}${query}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
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
        <Controller
          control={control}
          name="remember"
          render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />}
        />
        {t.auth.remember}
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        {t.auth.submitLogin}
        {!isSubmitting && <ArrowRight className="size-5" />}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.noAccount}{" "}
        <Link href={`${routes.register}${query}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
          {t.auth.createAccount}
        </Link>
      </p>
    </form>
  );
}
