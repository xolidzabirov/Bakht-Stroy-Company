"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { applyApiErrors, bff } from "@/shared/api/client";
import { useMe } from "@/shared/api/useMe";
import { useI18n } from "@/shared/i18n/client";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Textarea } from "@/shared/ui/kit/textarea";
import { PhoneInput } from "@/shared/ui/PhoneInput";

function createSchema(t: Dictionary) {
  const v = t.contacts.validation;

  return z.object({
    name: z.string().trim().min(2, v.name).max(100),
    phone: z.string().regex(/^\d{9}$/, v.phone),
    email: z.union([z.literal(""), z.string().trim().email(v.email).max(255)]),
    message: z.string().trim().min(5, v.message).max(3000),
  });
}

type Values = z.infer<ReturnType<typeof createSchema>>;

/**
 * "Напишите нам" (POST /contact): name, phone, optional email and the question.
 * Signed-in customers get their name and contacts filled in. Admins and managers see the message in the admin panel.
 */
export function ContactForm() {
  const { t } = useI18n();
  const { data: me } = useMe();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createSchema(t), [t]);
  const c = t.contacts;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: me?.name ?? "",
      phone: me?.phone?.startsWith("+992") ? me.phone.slice(4) : "",
      email: me?.email ?? "",
      message: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await bff("/api/proxy/contact", {
        body: { name: values.name, phone: `+992${values.phone}`, email: values.email || null, message: values.message },
      });
      reset({ ...values, message: "" });
      setSent(true);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["name", "phone", "email", "message"], t.errors));
    }
  });

  if (sent) {
    return (
      <div role="status" className="grid place-items-center py-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-success/10 text-success">
          <CircleCheck className="size-8" />
        </span>
        <h3 className="mt-5 text-xl font-extrabold">{c.sentTitle}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{c.sentText}</p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
          {c.sendAnother}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={c.name} error={errors.name?.message}>
          {(id, describedBy) => <TextInput id={id} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={describedBy} {...register("name")} />}
        </Field>
        <Field label={c.phone} error={errors.phone?.message}>
          {(id, describedBy) => (
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  id={id}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="93 123 45 67"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={describedBy}
                />
              )}
            />
          )}
        </Field>
      </div>

      <Field label={c.emailField} error={errors.email?.message}>
        {(id, describedBy) => <TextInput id={id} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={describedBy} {...register("email")} />}
      </Field>

      <Field label={c.message} error={errors.message?.message}>
        {(id, describedBy) => (
          <Textarea
            id={id}
            rows={5}
            placeholder={c.messagePlaceholder}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy}
            className="min-h-32 rounded-xl bg-surface px-4 py-3 text-[15px] md:text-[15px] dark:bg-surface"
            {...register("message")}
          />
        )}
      </Field>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
        {c.send}
      </Button>
      <p className="text-xs text-muted-foreground">{c.agree}</p>
    </form>
  );
}
