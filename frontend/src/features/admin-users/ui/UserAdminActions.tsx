"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, LoaderCircle, ShieldCheck, ShieldOff, Unlock } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { useI18n } from "@/shared/i18n/client";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

type Action = { kind: "role"; role: "manager" | "client" } | { kind: "block" } | { kind: "unblock" };

/**
 * Administrator's controls on a user card: make a manager / back to customer, block / unblock.
 * Each step is confirmed; the API refuses changes to administrators and to oneself.
 */
export function UserAdminActions({ userId, role, blocked }: { userId: number; role: "client" | "manager"; blocked: boolean }) {
  const { t } = useI18n();
  const u = t.admin.user;
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!action) return;
    setBusy(true);
    try {
      if (action.kind === "role") {
        await bff(`/api/proxy/admin/users/${userId}/role`, { method: "PATCH", body: { role: action.role } });
        toast.success(u.roleChanged);
      } else {
        await bff(`/api/proxy/admin/users/${userId}/${action.kind}`, { method: "PATCH" });
        toast.success(action.kind === "block" ? u.blockedDone : u.unblockedDone);
      }
      setAction(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  const title = !action ? "" : action.kind === "role" ? (action.role === "manager" ? u.makeManager : u.makeClient) : action.kind === "block" ? u.block : u.unblock;
  const text = !action ? "" : action.kind === "role" ? (action.role === "manager" ? u.managerText : u.clientText) : action.kind === "block" ? u.blockText : "";

  return (
    <div className="space-y-2">
      {role === "client" ? (
        <Button className="w-full" onClick={() => setAction({ kind: "role", role: "manager" })} disabled={blocked}>
          <ShieldCheck className="size-4" />
          {u.makeManager}
        </Button>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setAction({ kind: "role", role: "client" })}>
          <ShieldOff className="size-4" />
          {u.makeClient}
        </Button>
      )}
      {blocked ? (
        <Button variant="outline" className="w-full" onClick={() => setAction({ kind: "unblock" })}>
          <Unlock className="size-4" />
          {u.unblock}
        </Button>
      ) : (
        <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setAction({ kind: "block" })}>
          <Ban className="size-4" />
          {u.block}
        </Button>
      )}

      <Dialog open={action !== null} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{title}?</DialogTitle>
          {text && <DialogDescription>{text}</DialogDescription>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAction(null)}>
              {t.admin.common.cancel}
            </Button>
            <Button onClick={() => void run()} disabled={busy} className={action?.kind === "block" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}>
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {title}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
