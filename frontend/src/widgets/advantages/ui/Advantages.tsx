import { BadgePercent, Building2, Truck, Warehouse } from "lucide-react";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { SectionHeading } from "@/shared/ui/SectionHeading";

const icons = [Warehouse, Truck, BadgePercent, Building2];

/** Four reasons to buy here — on the home page (no heading) and on /about (with one). */
export async function Advantages({ title: heading }: { title?: string } = {}) {
  const { t } = await getI18n();

  return (
    <Container className={heading ? "mt-20 sm:mt-24" : "mt-16 sm:mt-20"}>
      {heading && <SectionHeading title={heading} />}
      <div className="grid gap-x-8 gap-y-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {t.advantages.map(({ title, text }, i) => {
          const Icon = icons[i];
          // Under a section heading the cards are h3; on the home page (no heading) they are top-level h2.
          const Title = heading ? "h3" : "h2";

          return (
          <div key={title}>
            <Icon className="size-6 text-foreground" strokeWidth={1.75} />
            <Title className="mt-4 font-display text-lg font-bold tracking-tight">{title}</Title>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </div>
          );
        })}
      </div>
    </Container>
  );
}
