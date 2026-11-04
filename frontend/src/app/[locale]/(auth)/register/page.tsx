import type { Metadata } from "next";
import { getSettings } from "@/entities/settings/api/getSettings";
import { GoogleButton } from "@/features/auth/ui/GoogleButton";
import { RegisterWizard } from "@/features/auth/ui/RegisterWizard";
import { safeNext } from "@/shared/config/auth";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.register, robots: { index: false } };
}

/** Registration wizard: name → phone (+992) → email → code from the letter → password. */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  const [{ t }, settings] = await Promise.all([getI18n(), getSettings()]);

  return (
    <RegisterWizard
      next={target}
      firstStepExtra={settings.auth?.google ? <GoogleButton label={t.auth.googleRegister} or={t.auth.or} next={target} separator="above" /> : undefined}
    />
  );
}
