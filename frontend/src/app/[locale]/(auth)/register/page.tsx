import type { Metadata } from "next";
import { getSettings } from "@/entities/settings/api/getSettings";
import { RegisterWizard } from "@/features/auth/ui/RegisterWizard";
import { SocialButtons } from "@/features/auth/ui/SocialButtons";
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
      firstStepExtra={settings.auth?.google ? <SocialButtons or={t.auth.or} next={target} googleLabel={t.auth.googleRegister} appleLabel={t.auth.appleRegister} appleSoon={t.auth.appleSoon} /> : undefined}
    />
  );
}
