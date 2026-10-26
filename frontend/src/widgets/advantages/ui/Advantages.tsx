import { BadgePercent, Building2, Truck, Warehouse } from "lucide-react";
import { Container } from "@/shared/ui";

const items = [
  { icon: Warehouse, title: "Свой склад", text: "Всё в наличии в Душанбе на ул. Джабор Расулов — без ожидания поставки." },
  { icon: Truck, title: "Доставка в день заказа", text: "Свои КамАЗы, манипуляторы и миксеры 10 м³ — с разгрузкой на объекте." },
  { icon: BadgePercent, title: "Оптовые цены", text: "Специальные условия для строительных компаний и бригад." },
  { icon: Building2, title: "Ремонт дорог", text: "Асфальт, бордюры и благоустройство дворов и местных дорог." },
];

export function Advantages() {
  return (
    <Container className="mt-14">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand text-ink">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
