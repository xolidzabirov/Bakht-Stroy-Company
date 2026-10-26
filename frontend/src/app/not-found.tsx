import { ButtonLink, Logo } from "@/shared/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <Logo withText={false} className="[&_svg]:size-16" />
        <p className="mt-6 font-display text-7xl font-extrabold text-brand">404</p>
        <h1 className="mt-2 text-2xl font-extrabold">Страница не найдена</h1>
        <p className="mt-2 text-muted">Возможно, товар сняли с продажи или ссылка устарела.</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/">На главную</ButtonLink>
          <ButtonLink href="/catalog" variant="outline">
            В каталог
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
