import Link from "next/link";
import { ArrowLeft, BellRing, Heart, PackageCheck, Phone } from "lucide-react";
import { routes, site } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n, setLocaleFrom } from "@/shared/i18n/server";
import { formatPhone } from "@/shared/lib/format";
import { Logo } from "@/shared/ui";

const icons = [PackageCheck, Heart, BellRing];

/**
 * Login, registration, password reset: no site header/footer, brand panel on the left (desktop).
 */
export default async function AuthLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  await setLocaleFrom(params);
  const { t } = await getI18n();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--brand) 0 2px, transparent 2px 28px)" }}
        />
        <Link href={routes.home} className="relative w-fit">
          <Logo inverted />
        </Link>

        <div className="relative my-auto max-w-md py-12">
          <h2 className="text-4xl font-extrabold leading-tight">
            {t.auth.panelTitleStart}
            <span className="text-brand">{t.auth.panelTitleAccent}</span>
          </h2>
          <ul className="mt-10 space-y-6">
            {t.auth.benefits.map(({ title, text }, i) => {
              const Icon = icons[i];

              return (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
                  <Icon className="size-5" />
                </span>
                <span>
                  <b className="block">{title}</b>
                  <span className="text-sm leading-relaxed text-white/65">{text}</span>
                </span>
              </li>
              );
            })}
          </ul>
        </div>

        <a href={`tel:${site.phones[0]}`} className="relative inline-flex w-fit items-center gap-2 text-sm text-white/70 hover:text-brand">
          <Phone className="size-4 text-brand" />
          {fmt(t.auth.questions, { phone: formatPhone(site.phones[0]) })}
        </a>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href={routes.home} className="lg:hidden">
            <Logo />
          </Link>
          <Link href={routes.home} className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            {t.common.toSite}
          </Link>
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-10">{children}</div>
      </main>
    </div>
  );
}
