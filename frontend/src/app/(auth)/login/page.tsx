import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { safeNext } from "@/shared/config/auth";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.login, robots: { index: false } };
}

type Props = { searchParams: Promise<{ next?: string; reset?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, reset } = await searchParams;
  const target = safeNext(next);
  const { t } = await getI18n();

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t.auth.loginTitle}</h1>
      <p className="mt-2 text-muted-foreground">
        {target === "/" ? t.auth.loginLead : t.auth.loginLeadNext}
      </p>
      <div className="mt-8">
        <LoginForm next={target} notice={reset ? t.auth.passwordChanged : undefined} />
      </div>
    </>
  );
}
