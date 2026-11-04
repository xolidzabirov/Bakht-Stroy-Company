"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Zap } from "lucide-react";
import { useMe } from "@/shared/api/useMe";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import type { QuickOrderProduct } from "./QuickOrderDialog";

// A long list has many buttons and few orders: the window loads only when it is needed.
const QuickOrderDialog = dynamic(() => import("./QuickOrderDialog").then((m) => m.QuickOrderDialog), { ssr: false });

/**
 * "Беру сразу": the quantity, then the usual checkout with this one product, past the cart. A dark button with a yellow bolt and a light
 * running over it, so it is not mistaken for "В корзину".
 */
export function QuickOrderButton({ product, variant = "card", className }: { product: QuickOrderProduct & { in_stock: boolean }; variant?: "card" | "page"; className?: string }) {
  const { t } = useI18n();
  const { isStaff } = useMe();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  if (isStaff || !product.in_stock) return null;

  const start = () => {
    setMounted(true);
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        size={variant === "page" ? "lg" : "sm"}
        onClick={start}
        aria-label={t.cart.quickOrder}
        title={t.cart.quickOrder}
        className={cn(
          "group/quick relative shrink-0 overflow-hidden whitespace-nowrap bg-[#16181d] text-white ring-1 ring-white/10 hover:bg-black",
          "before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:-skew-x-12 before:bg-white/25 before:transition-transform before:duration-700 before:ease-out hover:before:translate-x-[450%]",
          className,
        )}
      >
        <Zap className="size-4 fill-brand text-brand transition-transform duration-300 ease-out group-hover/quick:scale-125 group-hover/quick:-rotate-12" />
        <span>{t.cart.quickOrder}</span>
      </Button>
      {mounted && <QuickOrderDialog product={product} open={open} onOpenChange={setOpen} />}
    </>
  );
}
