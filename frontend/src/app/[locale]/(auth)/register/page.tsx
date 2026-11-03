import type { Metadata } from "next";
import { RegisterWizard } from "@/features/auth/ui/RegisterWizard";
import { safeNext } from "@/shared/config/auth";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.register, robots: { index: false } };
}

/** Registration wizard: name → phone (+992) → email → code from the letter → password. */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return <RegisterWizard next={safeNext(next)} />;
}
