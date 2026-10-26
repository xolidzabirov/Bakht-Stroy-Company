import { getI18n } from "@/shared/i18n/server";
import { ButtonLink, Logo } from "@/shared/ui";

export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <Logo withText={false} className="[&_svg]:size-16" />
        <p className="mt-6 font-display text-7xl font-extrabold text-brand">404</p>
        <h1 className="mt-2 text-2xl font-extrabold">{t.notFound.title}</h1>
        <p className="mt-2 text-muted">{t.notFound.text}</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/">{t.notFound.home}</ButtonLink>
          <ButtonLink href="/catalog" variant="outline">
            {t.notFound.catalog}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
