"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, LoaderCircle, Pencil, ShoppingCart } from "lucide-react";
import { useAddToCart, useCart } from "@/entities/cart/api/useCart";
import { ApiError } from "@/shared/api/http";
import { useMe } from "@/shared/api/useMe";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { useSessionName } from "@/shared/lib/useSession";
import { Button, buttonClasses } from "@/shared/ui";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";

type Props = {
  product: { id: number; min_order_qty: number; stock: number; in_stock: boolean };
  /** card — one compact button; page — quantity stepper + big button. */
  variant?: "card" | "page";
  className?: string;
};

/**
 * "В корзину". Guests go to the login page and come back here; signed-in users get a toast
 * with a link to the cart. A product that is already in the cart shows "В корзине".
 * The shop team does not buy: they get a link to the product in the admin panel instead.
 */
export function AddToCartButton({ product, variant = "card", className }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = useSessionName() !== null;
  const { isStaff, isCustomer } = useMe();
  const { data: cart } = useCart({ enabled: isCustomer });
  const add = useAddToCart();
  const [quantity, setQuantity] = useState(Math.max(1, product.min_order_qty));

  const inCart = cart?.items.find((item) => item.product?.id === product.id);
  const labels = { quantity: t.cart.quantity, decrease: t.cart.decrease, increase: t.cart.increase };

  const submit = () => {
    if (!signedIn) {
      router.push(`${routes.login}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    add.mutate(
      { productId: product.id, quantity: variant === "page" ? quantity : Math.max(1, product.min_order_qty) },
      {
        onSuccess: () => toast.success(t.cart.added, { action: { label: t.cart.goToCart, onClick: () => router.push(routes.cart) } }),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : t.errors.generic),
      },
    );
  };

  if (isStaff) {
    return (
      <Link href={routes.adminProduct(product.id)} className={buttonClasses({ variant: "outline", size: variant === "page" ? "lg" : "sm", className: cn("w-full", className) })}>
        <Pencil className="size-4" />
        {t.admin.common.edit}
      </Link>
    );
  }

  if (!product.in_stock) {
    return (
      <Button variant="secondary" size={variant === "page" ? "lg" : "sm"} disabled className={cn("w-full", className)}>
        {t.common.outOfStock}
      </Button>
    );
  }

  if (variant === "card") {
    return inCart ? (
      <Link href={routes.cart} className={buttonClasses({ variant: "outline", size: "sm", className: cn("w-full", className) })}>
        <Check className="size-4 text-success" />
        {t.cart.inCart}
      </Link>
    ) : (
      <Button size="sm" variant="outline" onClick={submit} disabled={add.isPending} className={cn("w-full group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand hover:border-brand hover:bg-brand-hover hover:text-on-brand", className)}>
        {add.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
        {t.cart.add}
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <QuantityStepper value={quantity} min={Math.max(1, product.min_order_qty)} max={product.stock} onChange={setQuantity} labels={labels} />
      <Button size="lg" onClick={submit} disabled={add.isPending} className="min-w-48 flex-1">
        {add.isPending ? <LoaderCircle className="size-5 animate-spin" /> : <ShoppingCart className="size-5" />}
        {t.cart.add}
      </Button>
      {inCart && (
        <Link href={routes.cart} className="inline-flex items-center gap-1.5 text-sm font-semibold text-success hover:underline">
          <Check className="size-4" />
          {t.cart.inCart}: {inCart.quantity}
        </Link>
      )}
    </div>
  );
}
