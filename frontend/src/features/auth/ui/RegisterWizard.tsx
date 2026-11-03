"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Lock, Mail, RotateCw, ShieldCheck } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { Button, Field, FormAlert, PasswordInput, TextInput } from "@/shared/ui";
import { OtpInput } from "@/shared/ui/OtpInput";
import { PhoneInput } from "@/shared/ui/PhoneInput";
import { type EmailStepValues, type RegNameValues, type RegPasswordValues, type RegPhoneValues, createAuthSchemas } from "../model/schemas";
import { PasswordStrength } from "./PasswordStrength";
import { secondsFromMessage, useCountdown } from "./useCountdown";

const TOTAL = 5;

type Countdown = ReturnType<typeof useCountdown>;

/** Sends the code to the address. `devCode` — only in local development, where the mail goes to the log. */
async function sendEmailCode(email: string): Promise<string | null> {
  const { data } = await bff<{ data: { dev_code: string | null } }>("/api/proxy/auth/register/email", { body: { email } });

  return data.dev_code;
}

/**
 * Registration in 5 steps: 1) first and last name — 2) Tajik phone — 3) email, a code goes there —
 * 4) the 6-digit code from the letter — 5) password twice → the account is created and signed in.
 */
export function RegisterWizard({ next }: { next: string }) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [name, setName] = useState<RegNameValues>({ first_name: "", last_name: "" });
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
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
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-colors duration-500", i < step ? "bg-primary" : "bg-border")} />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {fmt(t.reg.stepOf, { n: step, total: TOTAL })}: <span className="font-medium text-foreground">{t.reg.steps[step - 1]}</span>
        </p>
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
            onBack={() => go(1)}
            onDone={(digits) => {
              setPhone(digits);
              go(3);
            }}
          />
        )}
        {step === 3 && (
          <EmailStep
            initial={email}
            countdown={countdown}
            onBack={() => go(2)}
            onSent={(address, code) => {
              setEmail(address);
              setDevCode(code);
              go(4);
            }}
          />
        )}
        {step === 4 && (
          <CodeStep
            email={email}
            devCode={devCode}
            onResent={setDevCode}
            countdown={countdown}
            onChange={() => go(3)}
            onConfirmed={(token) => {
              setTicket(token);
              go(5);
            }}
          />
        )}
        {step === 5 && ticket && (
          <PasswordStep
            name={name}
            phone={phone}
            email={email}
            ticket={ticket}
            next={next}
            onBack={() => go(3)}
            onExpired={() => {
              setTicket(null);
              setStep(3);
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

/* ---------- 1. Name ---------- */

function NameStep({ initial, next, onDone }: { initial: RegNameValues; next: string; onDone: (values: RegNameValues) => void }) {
  const { t } = useI18n();
  const schema = useMemo(() => createAuthSchemas(t).regName, [t]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegNameValues>({ resolver: zodResolver(schema), defaultValues: initial });

  return (
    <form onSubmit={handleSubmit(onDone)} noValidate className="space-y-5">
      <StepHeader title={t.reg.step1Title} lead={t.reg.step1Lead} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.reg.firstName} error={errors.first_name?.message}>
          {(id, describedBy) => (
            <TextInput id={id} autoComplete="given-name" placeholder={t.reg.firstNamePlaceholder} autoFocus aria-invalid={Boolean(errors.first_name)} aria-describedby={describedBy} {...register("first_name")} />
          )}
        </Field>
        <Field label={t.reg.lastName} error={errors.last_name?.message}>
          {(id, describedBy) => (
            <TextInput id={id} autoComplete="family-name" placeholder={t.reg.lastNamePlaceholder} aria-invalid={Boolean(errors.last_name)} aria-describedby={describedBy} {...register("last_name")} />
          )}
        </Field>
      </div>

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

function PhoneStep({ initial, onBack, onDone }: { initial: string; onBack: () => void; onDone: (digits: string) => void }) {
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
      // A real number that is not taken yet — better to say it now than on the last step.
      await bff("/api/proxy/auth/register/phone", { body: { phone: `+992${phone}` } });
      onDone(phone);
    } catch (error) {
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
              <PhoneInput id={id} value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="93 123 45 67" autoFocus aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy} />
            )}
          />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {t.reg.next}
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
      </Button>

      <BackButton onClick={onBack} />
    </form>
  );
}

/* ---------- 3. Email ---------- */

function EmailStep({ initial, countdown, onBack, onSent }: { initial: string; countdown: Countdown; onBack: () => void; onSent: (email: string, devCode: string | null) => void }) {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createAuthSchemas(t).emailStep, [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailStepValues>({ resolver: zodResolver(schema), defaultValues: { email: initial } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);

    try {
      const code = await sendEmailCode(email);
      countdown.start();
      onSent(email, code);
    } catch (error) {
      // A code went to this address a moment ago — go on and wait for it.
      if (error instanceof ApiError && error.code === "CODE_RECENTLY_SENT") {
        countdown.start(secondsFromMessage(error.message) ?? 60);
        onSent(email, null);
        return;
      }
      setFormError(applyApiErrors(error, setError, ["email"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <StepHeader title={t.reg.step3Title} lead={t.reg.step3Lead} />
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label={t.auth.email} error={errors.email?.message}>
        {(id, describedBy) => (
          <TextInput id={id} type="email" autoComplete="email" inputMode="email" placeholder={t.auth.emailPlaceholder} autoFocus aria-invalid={Boolean(errors.email)} aria-describedby={describedBy} {...register("email")} />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : <Mail className="size-5" />}
        {t.reg.getCode}
      </Button>

      <BackButton onClick={onBack} />
    </form>
  );
}

/* ---------- 4. Code from the letter ---------- */

function CodeStep({
  email,
  devCode,
  onResent,
  countdown,
  onChange,
  onConfirmed,
}: {
  email: string;
  devCode: string | null;
  onResent: (devCode: string | null) => void;
  countdown: Countdown;
  onChange: () => void;
  onConfirmed: (token: string) => void;
}) {
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
      const response = await bff<{ data: { registration_token: string } }>("/api/proxy/auth/register/email/verify", { body: { email, code: value } });
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
      onResent(await sendEmailCode(email));
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
        title={t.reg.step4Title}
        lead={
          <>
            {fmt(t.reg.step4Lead, { email })}{" "}
            <button type="button" onClick={onChange} className="font-semibold text-foreground underline-offset-4 hover:underline">
              {t.reg.change}
            </button>
          </>
        }
      />

      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {devCode && <FormAlert tone="info">{fmt(t.reg.devCode, { code: devCode })}</FormAlert>}

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

/* ---------- 5. Password ---------- */

function PasswordStep({
  name,
  phone,
  email,
  ticket,
  next,
  onBack,
  onExpired,
}: {
  name: RegNameValues;
  phone: string;
  email: string;
  ticket: string;
  next: string;
  onBack: () => void;
  onExpired: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createAuthSchemas(t, email).regPassword, [t, email]);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegPasswordValues>({ resolver: zodResolver(schema), defaultValues: { password: "", password_confirmation: "" } });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await bff("/api/auth/register", { body: { ...name, ...values, phone: `+992${phone}`, registration_token: ticket } });
      toast.success(fmt(t.reg.created, { name: name.first_name.trim() }));
      router.replace(next);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === "REGISTRATION_EXPIRED") {
        onExpired();
        return;
      }
      const message = applyApiErrors(error, setError, ["password", "password_confirmation"], t.errors);
      // The address or the number was taken by someone else meanwhile — show it on top.
      setFormError(error instanceof ApiError && error.errors && !message ? (Object.entries(error.errors).find(([field]) => !field.startsWith("password"))?.[1][0] ?? null) : message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <StepHeader title={t.reg.step5Title} lead={fmt(t.reg.step5Lead, { email })} />
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label={t.auth.password} error={errors.password?.message}>
        {(id, describedBy) => (
          <>
            <PasswordInput id={id} autoComplete="new-password" placeholder={t.auth.newPasswordPlaceholder} autoFocus aria-invalid={Boolean(errors.password)} aria-describedby={describedBy} {...register("password")} />
            <PasswordStrength value={password} email={email} />
          </>
        )}
      </Field>

      <Field label={t.auth.confirmPassword} error={errors.password_confirmation?.message}>
        {(id, describedBy) => (
          <PasswordInput id={id} autoComplete="new-password" placeholder={t.auth.confirmPlaceholder} aria-invalid={Boolean(errors.password_confirmation)} aria-describedby={describedBy} {...register("password_confirmation")} />
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
