"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Trash2 } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { useI18n } from "@/shared/i18n/client";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

/** Delete (with a confirmation) for one contact-form message. */
export function MessageActions({ id, name }: { id: number; name: string }) {
  const { t } = useI18n();
  const m = t.admin.messages;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await bff(`/api/proxy/admin/messages/${id}`, { method: "DELETE" });
      toast.success(t.admin.common.deleted);
      setConfirming(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-1.5">
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} disabled={busy} aria-label={t.admin.common.delete} className="text-destructive hover:text-destructive">
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{t.admin.common.confirmDelete.replace("{name}", name)}</DialogTitle>
          <DialogDescription>{m.deleteText}</DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              {t.admin.common.cancel}
            </Button>
            <Button onClick={() => void remove()} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {t.admin.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
