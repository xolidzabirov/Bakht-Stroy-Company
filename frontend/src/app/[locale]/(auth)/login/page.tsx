import type { Metadata } from "next";
import { getSettings } from "@/entities/settings/api/getSettings";
import { GoogleButton } from "@/features/auth/ui/GoogleButton";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { safeNext } from "@/shared/config/auth";
import { getI18n } from "@/shared/i18n/server";
import { FormAlert } from "@/shared/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.login, robots: { index: false } };
}

type Props = { searchParams: Promise<{ next?: string; reset?: string; google?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, reset, google } = await searchParams;
  const target = safeNext(next);
  const [{ t }, settings] = await Promise.all([getI18n(), getSettings()]);
  const errors: Record<string, string> = t.auth.googleErrors;
  const googleError = google ? (errors[google] ?? errors.failed) : null;

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t.auth.loginTitle}</h1>
      <p className="mt-2 text-muted-foreground">
        {target === "/" ? t.auth.loginLead : t.auth.loginLeadNext}
      </p>
      {googleError && (
        <div className="mt-6">
          <FormAlert>{googleError}</FormAlert>
        </div>
      )}
      {settings.auth?.google && (
        <div className="mt-8">
          <GoogleButton label={t.auth.googleLogin} or={t.auth.or} next={target} separator="below" />
        </div>
      )}
      <div className={settings.auth?.google ? "mt-5" : "mt-8"}>
        <LoginForm next={target} notice={reset ? t.auth.passwordChanged : undefined} />
      </div>
    </>
  );
}
