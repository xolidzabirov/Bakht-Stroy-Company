import type { LucideIcon } from "lucide-react";
import { routes } from "@/shared/config/site";
import { Breadcrumbs, ButtonLink, Container } from "@/shared/ui";

/**
 * Page with a big icon, a short text and the way to the catalog (empty cart, no favorites…).
 */
export function EmptyState({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) {
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Главная", href: routes.home }, { label: title }]} />
      <div className="mt-6 grid place-items-center rounded-[var(--radius-card)] border border-dashed border-border px-6 py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-ink text-brand ring-2 ring-brand ring-offset-2 ring-offset-background">
          <Icon className="size-9" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold">{title}</h1>
        <p className="mt-2 max-w-md text-muted">{text}</p>
        <ButtonLink href={routes.catalog} className="mt-6">
          Перейти в каталог
        </ButtonLink>
      </div>
    </Container>
  );
}
