"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, LoaderCircle, Pencil, ShoppingCart } from "lucide-react";
import { useAddToCart, useCart, useSetCartQuantity, useRemoveFromCart } from "@/entities/cart/api/useCart";
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
 * with a link to the cart.
 *
 * Card variant: first click adds the product; then a QuantityStepper appears (− [qty] +).
 * Pressing "−" below min_order_qty removes the item from the cart and shows the button again.
 *
 * The shop team does not buy: on a card they see what customers see, but the button only explains
 * that and offers to edit the product; on the product page they get a link to the admin panel instead.
 */
export function AddToCartButton({ product, variant = "card", className }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = useSessionName() !== null;
  const { isStaff, isCustomer } = useMe();
  const { data: cart } = useCart({ enabled: isCustomer });
  const add = useAddToCart();
  const setCartQty = useSetCartQuantity();
  const removeFromCart = useRemoveFromCart();
  const [quantity, setQuantity] = useState(Math.max(1, product.min_order_qty));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inCart = cart?.items.find((item) => item.product?.id === product.id);
  const labels = { quantity: t.cart.quantity, decrease: t.cart.decrease, increase: t.cart.increase };

  // Keep local quantity in sync with server cart.
  const [cardQty, setCardQty] = useState(inCart?.quantity ?? 0);
  useEffect(() => {
    setCardQty(inCart?.quantity ?? 0);
  }, [inCart?.quantity]);

  // Debounced server sync for the card stepper (400 ms after the last change).
  useEffect(() => {
    if (!inCart || cardQty === inCart.quantity || cardQty <= 0) return;

    const timer = setTimeout(() => {
      setCartQty.mutate(
        { itemId: inCart.id, quantity: cardQty },
        {
          onError: (error) => {
            toast.error(error instanceof ApiError ? error.message : t.errors.generic);
            setCardQty(inCart.quantity);
          },
        },
      );
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when cardQty changes
  }, [cardQty]);

  /** Handle stepper change in card variant: 0 or below min → remove from cart. */
  const handleCardStepperChange = (newQty: number) => {
    if (newQty < Math.max(1, product.min_order_qty) && inCart) {
      // Going below minimum → remove item.
      setCardQty(0);
      removeFromCart.mutate(inCart.id, {
        onSuccess: () => toast.success(t.cart.removed, { id: "cart-removed" }),
        onError: () => toast.error(t.errors.generic),
      });
      return;
    }
    setCardQty(newQty);
  };

  const submit = () => {
    if (!signedIn) {
      router.push(`${routes.login}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isStaff) {
      toast.info(t.cart.staffCannotBuy, { action: { label: t.cart.editProduct, onClick: () => router.push(routes.adminProduct(product.id)) } });
      return;
    }

    add.mutate(
      { productId: product.id, quantity: variant === "page" ? quantity : Math.max(1, product.min_order_qty) },
      {
        onSuccess: () => toast.success(t.cart.added, { id: "cart-added", action: { label: t.cart.goToCart, onClick: () => router.push(routes.cart) } }),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : t.errors.generic),
      },
    );
  };

  if (isStaff && variant === "page") {
    return (
      <Link href={routes.adminProduct(product.id)} className={buttonClasses({ variant: "outline", size: "lg", className: cn("w-full", className) })}>
        <Pencil className="size-4" />
        {t.cart.editProduct}
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
    // If the product is already in cart → show the quantity stepper (− [qty] +).
    // Render only after mount to prevent SSR hydration mismatch with client-side cart cache.
    if (mounted && inCart && cardQty > 0) {
      return (
        <QuantityStepper
          size="sm"
          value={cardQty}
          min={Math.max(1, product.min_order_qty) - 1}
          max={product.stock}
          onChange={handleCardStepperChange}
          labels={labels}
          className={cn("w-full justify-center", className)}
        />
      );
    }

    // Not in cart (or initial SSR) → show "В корзину" button.
    return (
      <Button
        size="sm"
        onClick={submit}
        disabled={add.isPending}
        className={cn("w-full bg-brand text-on-brand hover:bg-brand-hover", className)}
      >
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
      {mounted && inCart && (
        <Link href={routes.cart} className="inline-flex items-center gap-1.5 text-sm font-semibold text-success hover:underline">
          <Check className="size-4" />
          {t.cart.inCart}: {inCart.quantity}
        </Link>
      )}
    </div>
  );
}
