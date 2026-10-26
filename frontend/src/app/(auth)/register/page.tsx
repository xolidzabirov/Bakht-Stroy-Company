import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { safeNext } from "@/shared/config/auth";

export const metadata: Metadata = { title: "Регистрация", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <>
      <h1 className="text-3xl font-extrabold">Регистрация</h1>
      <p className="mt-2 text-muted">Займёт минуту: подтвердите email кодом из письма и придумайте пароль.</p>
      <div className="mt-8">
        <RegisterForm next={safeNext(next)} />
      </div>
    </>
  );
}
