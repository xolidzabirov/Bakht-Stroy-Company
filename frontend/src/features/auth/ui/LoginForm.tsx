"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { applyApiErrors, bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { Button, Field, FormAlert, PasswordInput, TextInput } from "@/shared/ui";
import { type LoginValues, loginSchema } from "../model/schemas";

type Props = {
  /** Where to go after signing in (already checked by safeNext). */
  next: string;
  notice?: string;
};

export function LoginForm({ next, notice }: Props) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", remember: true } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await bff("/api/auth/login", { body: values });
      router.replace(next);
      router.refresh();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["email", "password"]));
    }
  });

  const query = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label="Email" error={errors.email?.message}>
        {(id, describedBy) => (
          <TextInput
            id={id}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@gmail.com"
            autoFocus
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy}
            {...register("email")}
          />
        )}
      </Field>

      <Field
        label="Пароль"
        error={errors.password?.message}
        aside={
          <Link href={`${routes.forgotPassword}${query}`} className="text-sm font-medium text-muted hover:text-foreground">
            Забыли пароль?
          </Link>
        }
      >
        {(id, describedBy) => (
          <PasswordInput id={id} autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={describedBy} {...register("password")} />
        )}
      </Field>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="size-5 rounded accent-brand" {...register("remember")} />
        Запомнить меня на этом устройстве
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
        Войти
        {!isSubmitting && <ArrowRight className="size-5" />}
      </Button>

      <p className="text-center text-sm text-muted">
        Впервые у нас?{" "}
        <Link href={`${routes.register}${query}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
          Создать аккаунт
        </Link>
      </p>
    </form>
  );
}
