"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Building2, Check, House, LoaderCircle, Lock, RotateCw, Send, ShieldCheck } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { formatPhone } from "@/shared/lib/format";
import { Button, Field, FormAlert, PasswordInput, TextInput } from "@/shared/ui";
import { OtpInput } from "@/shared/ui/OtpInput";
import { PhoneInput } from "@/shared/ui/PhoneInput";
import { type RegAccountValues, type RegNameValues, type RegPhoneValues, createAuthSchemas } from "../model/schemas";
import { PasswordStrength } from "./PasswordStrength";
import { secondsFromMessage, useCountdown } from "./useCountdown";

const TOTAL = 4;

type Countdown = ReturnType<typeof useCountdown>;

/**
 * Registration in 4 steps (like a phone setup wizard):
 * 1) name and "who are you" — 2) Tajik phone → code to its Telegram — 3) the code → a pass for 30 min —
 * 4) email and password → the account is created and signed in.
 */
export function RegisterWizard({ next }: { next: string }) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [name, setName] = useState<RegNameValues>({ first_name: "", last_name: "", customer_type: "person" });
  const [phone, setPhone] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const countdown = useCountdown();

  const go = (to: number) => {
    setNotice(null);
    setStep(to);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-colors duration-500", i < step ? "bg-primary" : "bg-border")} />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{fmt(t.reg.stepOf, { n: step, total: TOTAL })}</p>
      </div>

      {notice && (
        <div className="mb-5">
          <FormAlert>{notice}</FormAlert>
        </div>
      )}

      <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
        {step === 1 && (
          <NameStep
            initial={name}
            next={next}
            onDone={(values) => {
              setName(values);
              go(2);
            }}
          />
        )}
        {step === 2 && (
          <PhoneStep
            initial={phone}
            countdown={countdown}
            onBack={() => go(1)}
            onSent={(digits) => {
              setPhone(digits);
              go(3);
            }}
          />
        )}
        {step === 3 && (
          <CodeStep
            phone={phone}
            countdown={countdown}
            onChange={() => go(2)}
            onConfirmed={(token) => {
              setTicket(token);
              go(4);
            }}
          />
        )}
        {step === 4 && ticket && (
          <AccountStep
            name={name}
            phone={phone}
            ticket={ticket}
            next={next}
            onBack={() => go(3)}
            onExpired={() => {
              setTicket(null);
              setStep(2);
              setNotice(t.reg.expired);
            }}
          />
        )}
      </div>
    </div>
  );
}

function StepHeader({ title, lead }: { title: string; lead: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{lead}</p>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();

  return (
    <button type="button" onClick={onClick} className="mx-auto flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" />
      {t.reg.back}
    </button>
  );
}

/* ---------- 1. Name and who you are ---------- */

function NameStep({ initial, next, onDone }: { initial: RegNameValues; next: string; onDone: (values: RegNameValues) => void }) {
  const { t } = useI18n();
  const schema = useMemo(() => createAuthSchemas(t).regName, [t]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegNameValues>({ resolver: zodResolver(schema), defaultValues: initial });

  const types = [
    { value: "person" as const, icon: House, title: t.reg.person, text: t.reg.personText },
    { value: "company" as const, icon: Building2, title: t.reg.company, text: t.reg.companyText },
  ];

  return (
    <form onSubmit={handleSubmit(onDone)} noValidate className="space-y-5">
      <StepHeader title={t.reg.step1Title} lead={t.reg.step1Lead} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.reg.firstName} error={errors.first_name?.message}>
          {(id, describedBy) => (
            <TextInput
              id={id}
              autoComplete="given-name"
              placeholder={t.reg.firstNamePlaceholder}
              autoFocus
              aria-invalid={Boolean(errors.first_name)}
              aria-describedby={describedBy}
              {...register("first_name")}
            />
          )}
        </Field>
        <Field label={t.reg.lastName} error={errors.last_name?.message}>
          {(id, describedBy) => (
            <TextInput
              id={id}
              autoComplete="family-name"
              placeholder={t.reg.lastNamePlaceholder}
              aria-invalid={Boolean(errors.last_name)}
              aria-describedby={describedBy}
              {...register("last_name")}
            />
          )}
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t.reg.whoAreYou}</legend>
        <Controller
          control={control}
          name="customer_type"
          render={({ field }) => (
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
              {types.map(({ value, icon: Icon, title, text }) => {
                const active = field.value === value;

                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "relative flex gap-3 rounded-2xl border bg-surface p-4 text-left transition",
                      active ? "border-primary ring-[3px] ring-primary/25" : "border-border hover:border-foreground/30",
                    )}
                  >
                    <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <b className="block">{title}</b>
                      <span className="text-sm leading-snug text-muted-foreground">{text}</span>
                    </span>
                    {active && <Check className="absolute right-3 top-3 size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        />
      </fieldset>

      <Button type="submit" size="lg" className="w-full">
        {t.reg.next}
        <ArrowRight className="size-5" />
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

/* ---------- 2. Phone ---------- */

async function sendPhoneCode(digits: string) {
  await bff("/api/proxy/auth/register/phone", { body: { phone: `+992${digits}` } });
}

function PhoneStep({ initial, countdown, onBack, onSent }: { initial: string; countdown: Countdown; onBack: () => void; onSent: (digits: string) => void }) {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createAuthSchemas(t).regPhone, [t]);
  const {
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegPhoneValues>({ resolver: zodResolver(schema), defaultValues: { phone: initial } });

  const onSubmit = handleSubmit(async ({ phone }) => {
    setFormError(null);

    try {
      await sendPhoneCode(phone);
      countdown.start();
      onSent(phone);
    } catch (error) {
      // A code went to this number a moment ago — go on and wait for it.
      if (error instanceof ApiError && error.code === "CODE_RECENTLY_SENT") {
        countdown.start(secondsFromMessage(error.message) ?? 60);
        onSent(phone);
        return;
      }
      if (error instanceof ApiError && error.code === "PHONE_NOT_ON_TELEGRAM") {
        setError("phone", { type: "server", message: error.message });
        return;
      }
      setFormError(applyApiErrors(error, setError, ["phone"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <StepHeader title={t.reg.step2Title} lead={t.reg.step2Lead} />
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label={t.reg.phone} error={errors.phone?.message} hint={t.reg.phoneHint}>
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
                autoFocus
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={describedBy}
              />
            )}
          />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}
        {t.reg.getCode}
      </Button>

      <BackButton onClick={onBack} />
    </form>
  );
}

/* ---------- 3. Code from Telegram ---------- */

function CodeStep({ phone, countdown, onChange, onConfirmed }: { phone: string; countdown: Countdown; onChange: () => void; onConfirmed: (token: string) => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const verify = async (value: string) => {
    if (value.length !== 6) {
      setError(t.reg.validation.code);
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await bff<{ data: { registration_token: string } }>("/api/proxy/auth/register/phone/verify", {
        body: { phone: `+992${phone}`, code: value },
      });
      onConfirmed(response.data.registration_token);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : t.errors.generic);
      setCode("");
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    setError(null);
    setNotice(null);

    try {
      await sendPhoneCode(phone);
      countdown.start();
      setNotice(t.reg.newCodeSent);
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === "CODE_RECENTLY_SENT") countdown.start(secondsFromMessage(failure.message) ?? 60);
      setError(failure instanceof ApiError ? failure.message : t.errors.generic);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void verify(code);
      }}
      noValidate
      className="space-y-5"
    >
      <StepHeader
        title={t.reg.step3Title}
        lead={
          <>
            {fmt(t.reg.step3Lead, { phone: formatPhone(`+992${phone}`) })}{" "}
            <button type="button" onClick={onChange} className="font-semibold text-foreground underline-offset-4 hover:underline">
              {t.reg.change}
            </button>
          </>
        }
      />

      {notice && <FormAlert tone="success">{notice}</FormAlert>}

      <OtpInput label={t.auth.code} value={code} onChange={setCode} onComplete={(value) => void verify(value)} invalid={Boolean(error)} disabled={pending} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={resend}
        disabled={countdown.left > 0}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
      >
        <RotateCw className="size-4" />
        {countdown.left > 0 ? fmt(t.reg.resendIn, { seconds: countdown.left }) : t.reg.resend}
      </button>

      <Button type="submit" size="lg" className="w-full" disabled={pending || code.length !== 6}>
        {pending ? <LoaderCircle className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
        {t.reg.confirm}
      </Button>

      <p className="flex gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" />
        {t.reg.codeNote}
      </p>
    </form>
  );
}

/* ---------- 4. Email and password ---------- */

function AccountStep({
  name,
  phone,
  ticket,
  next,
  onBack,
  onExpired,
}: {
  name: RegNameValues;
  phone: string;
  ticket: string;
  next: string;
  onBack: () => void;
  onExpired: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createAuthSchemas(t).regAccount, [t]);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegAccountValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", password_confirmation: "" } });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await bff("/api/auth/register", { body: { ...name, ...values, registration_token: ticket } });
      router.replace(next);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === "REGISTRATION_EXPIRED") {
        onExpired();
        return;
      }
      const message = applyApiErrors(error, setError, ["email", "password", "password_confirmation"], t.errors);
      // The number was taken by someone else meanwhile, or the name did not pass — show it on top.
      setFormError(error instanceof ApiError && error.errors && !message ? Object.values(error.errors)[0]?.[0] ?? null : message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <StepHeader title={t.reg.step4Title} lead={fmt(t.reg.step4Lead, { phone: formatPhone(`+992${phone}`) })} />
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
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />}
        {t.reg.create}
      </Button>

      <BackButton onClick={onBack} />
    </form>
  );
}
