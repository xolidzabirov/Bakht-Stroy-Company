"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Trash2 } from "lucide-react";
import { bff } from "@/shared/api/client";
import { ApiError } from "@/shared/api/http";
import { useAdminI18n } from "@/shared/i18n/client";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

/** Removes a review after a confirmation: it leaves the site and the stars of the product are counted again. */
export function DeleteReview({ reviewId }: { reviewId: number }) {
  const { t } = useAdminI18n();
  const r = t.admin.product.reviews;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await bff(`/api/proxy/admin/reviews/${reviewId}`, { method: "DELETE" });
      toast.success(t.admin.common.deleted);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={r.delete}
        title={r.delete}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{r.deleteTitle}</DialogTitle>
          <DialogDescription>{r.deleteText}</DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.admin.common.cancel}
            </Button>
            <Button onClick={() => void remove()} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {t.admin.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
