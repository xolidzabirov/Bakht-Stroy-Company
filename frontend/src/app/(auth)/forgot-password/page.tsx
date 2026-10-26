import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/ui/ForgotPasswordForm";
import { safeNext } from "@/shared/config/auth";
import { routes } from "@/shared/config/site";

export const metadata: Metadata = { title: "Восстановление пароля", robots: { index: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <>
      <h1 className="text-3xl font-extrabold">Восстановление пароля</h1>
      <p className="mt-2 text-muted">Бывает. Пришлём код на почту — и зададите новый пароль.</p>
      <div className="mt-8">
        <ForgotPasswordForm next={safeNext(next)} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Вспомнили?{" "}
        <Link href={routes.login} className="font-semibold text-foreground underline-offset-4 hover:underline">
          Войти
        </Link>
      </p>
    </>
  );
}
