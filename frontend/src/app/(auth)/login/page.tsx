import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { safeNext } from "@/shared/config/auth";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string; reset?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, reset } = await searchParams;
  const target = safeNext(next);

  return (
    <>
      <h1 className="text-3xl font-extrabold">Вход</h1>
      <p className="mt-2 text-muted">
        {target === "/" ? "Войдите, чтобы покупать и следить за заказами." : "Войдите, чтобы продолжить — после входа вернём вас обратно."}
      </p>
      <div className="mt-8">
        <LoginForm next={target} notice={reset ? "Пароль изменён. Войдите с новым паролем." : undefined} />
      </div>
    </>
  );
}
