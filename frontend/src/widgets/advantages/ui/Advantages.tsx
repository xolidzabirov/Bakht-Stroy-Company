import { BadgePercent, Building2, Truck, Warehouse } from "lucide-react";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { SectionHeading } from "@/shared/ui/SectionHeading";

const icons = [Warehouse, Truck, BadgePercent, Building2];

/** Four reasons to buy here — on the home page (no heading) and on /about (with one). */
export async function Advantages({ title }: { title?: string } = {}) {
  const { t } = await getI18n();

  return (
    <Container className={title ? "mt-16" : "mt-14"}>
      {title && <SectionHeading title={title} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.advantages.map(({ title, text }, i) => {
          const Icon = icons[i];

          return (
          <div key={title} className="rounded-[var(--radius-card)] border border-border bg-surface p-5 card-hover">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand text-on-brand">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </div>
          );
        })}
      </div>
    </Container>
  );
}
