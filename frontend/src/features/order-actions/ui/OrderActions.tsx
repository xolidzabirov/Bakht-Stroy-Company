"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle, RotateCcw, XCircle } from "lucide-react";
import { cartKey } from "@/entities/cart/api/useCart";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

/**
 * "Cancel" (with a confirmation, only while allowed) and "Order again" (puts the same items into the cart).
 */
export function OrderActions({ number, canCancel }: { number: string; canCancel: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<"cancel" | "repeat" | null>(null);

  const run = async (action: "cancel" | "repeat") => {
    setPending(action);

    try {
      await bff(`/api/proxy/orders/${encodeURIComponent(number)}/${action}`);

      if (action === "cancel") {
        toast.success(t.acc.order.cancelled);
        setConfirming(false);
        router.refresh();
      } else {
        await queryClient.invalidateQueries({ queryKey: cartKey });
        toast.success(t.acc.order.repeated);
        router.push(routes.cart);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="dark" onClick={() => run("repeat")} disabled={pending !== null}>
        {pending === "repeat" ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
        {t.acc.order.repeat}
      </Button>

      {canCancel && (
        <>
          <Button variant="outline" onClick={() => setConfirming(true)} disabled={pending !== null} className="text-destructive hover:text-destructive">
            <XCircle className="size-4" />
            {t.acc.order.cancel}
          </Button>
          <Dialog open={confirming} onOpenChange={setConfirming}>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogTitle className="text-xl font-extrabold">{fmt(t.acc.order.cancelTitle, { number })}</DialogTitle>
              <DialogDescription>{t.acc.order.cancelText}</DialogDescription>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setConfirming(false)}>
                  {t.acc.order.keep}
                </Button>
                <Button onClick={() => run("cancel")} disabled={pending === "cancel"} className="bg-destructive text-white hover:bg-destructive/90">
                  {pending === "cancel" && <LoaderCircle className="size-4 animate-spin" />}
                  {t.acc.order.cancelYes}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
