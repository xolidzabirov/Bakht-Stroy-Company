import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { formatMoney } from "@/shared/lib/format";
import { Badge } from "@/shared/ui";

type Props = {
  product: Product;
  /** Slot for the "add to cart" button (features/add-to-cart). */
  action?: React.ReactNode;
};

export function ProductCard({ product, action }: Props) {
  const image = product.image;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition hover:shadow-xl hover:shadow-black/5">
      <Link href={routes.product(product.slug)} className="relative block aspect-square overflow-hidden bg-surface-muted">
        {image && (
          <Image
            src={image.card}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.discount_percent ? <Badge tone="danger" className="bg-danger text-white">−{product.discount_percent}%</Badge> : null}
          {product.is_featured && <Badge>Хит</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{product.category.name}</p>
        )}
        <Link href={routes.product(product.slug)} className="line-clamp-2 min-h-[2.75rem] font-semibold leading-snug hover:underline">
          {product.name}
        </Link>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-extrabold">{formatMoney(product.price)}</span>
            {product.old_price ? <span className="text-sm text-muted line-through">{formatMoney(product.old_price)}</span> : null}
          </div>
          <p className="text-xs text-muted">
            за {product.unit.label}
            {product.min_order_qty > 1 && ` · от ${product.min_order_qty} ${product.unit.label}`}
          </p>
          <p className={product.in_stock ? "mt-1 text-xs font-medium text-success" : "mt-1 text-xs font-medium text-danger"}>
            {product.in_stock ? "В наличии" : "Нет в наличии"}
          </p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </article>
  );
}
