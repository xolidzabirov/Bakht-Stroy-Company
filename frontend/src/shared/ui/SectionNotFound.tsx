import { SearchX } from "lucide-react";
import { getI18n } from "@/shared/i18n/server";
import { ButtonLink } from "@/shared/ui";

/** "Nothing here" inside the account or the admin panel: the section menu stays, one button leads back. */
export async function SectionNotFound({ href, label }: { href: string; label: string }) {
  const { t } = await getI18n();

  return (
    <section className="grid min-h-[60vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-md animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-muted">
          <SearchX className="size-9 text-muted-foreground" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold sm:text-3xl">{t.serverError.sectionNotFound}</h1>
        <p className="mt-2 text-muted-foreground">{t.serverError.sectionNotFoundText}</p>
        <ButtonLink href={href} className="mt-7">
          {label}
        </ButtonLink>
      </div>
    </section>
  );
}
