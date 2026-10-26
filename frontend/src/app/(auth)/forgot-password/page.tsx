import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/ui/ForgotPasswordForm";
import { safeNext } from "@/shared/config/auth";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.forgot, robots: { index: false } };
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { t }] = await Promise.all([searchParams, getI18n()]);

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t.auth.forgotTitle}</h1>
      <p className="mt-2 text-muted-foreground">{t.auth.forgotLead}</p>
      <div className="mt-8">
        <ForgotPasswordForm next={safeNext(next)} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.remembered}{" "}
        <Link href={routes.login} className="font-semibold text-foreground underline-offset-4 hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </>
  );
}
