import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { safeNext } from "@/shared/config/auth";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.register, robots: { index: false } };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { t }] = await Promise.all([searchParams, getI18n()]);

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t.auth.registerTitle}</h1>
      <p className="mt-2 text-muted">{t.auth.registerLead}</p>
      <div className="mt-8">
        <RegisterForm next={safeNext(next)} />
      </div>
    </>
  );
}
