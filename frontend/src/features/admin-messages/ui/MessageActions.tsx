"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, LoaderCircle, Trash2 } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { useI18n } from "@/shared/i18n/client";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

/** "Прочитано" and delete (with a confirmation) for one contact-form message. */
export function MessageActions({ id, read, name }: { id: number; read: boolean; name: string }) {
  const { t } = useI18n();
  const m = t.admin.messages;
  const router = useRouter();
  const [busy, setBusy] = useState<"read" | "delete" | null>(null);
  const [confirming, setConfirming] = useState(false);

  const run = async (kind: "read" | "delete") => {
    setBusy(kind);
    try {
      await bff(kind === "read" ? `/api/proxy/admin/messages/${id}/read` : `/api/proxy/admin/messages/${id}`, { method: kind === "read" ? "PATCH" : "DELETE" });
      if (kind === "delete") {
        toast.success(t.admin.common.deleted);
        setConfirming(false);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-1.5">
      {!read && (
        <Button size="sm" variant="outline" onClick={() => void run("read")} disabled={busy !== null}>
          {busy === "read" ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
          {m.markRead}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} disabled={busy !== null} aria-label={t.admin.common.delete} className="text-destructive hover:text-destructive">
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
            <Button onClick={() => void run("delete")} disabled={busy !== null} className="bg-destructive text-white hover:bg-destructive/90">
              {busy === "delete" && <LoaderCircle className="size-4 animate-spin" />}
              {t.admin.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
