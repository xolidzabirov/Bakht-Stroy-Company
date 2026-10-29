"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  ShieldOff,
  Unlock,
} from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { useI18n } from "@/shared/i18n/client";
import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import { type Credentials, CredentialsCard } from "./CredentialsCard";

type Action =
  | { kind: "role"; role: "manager" | "client" }
  | { kind: "block" }
  | { kind: "unblock" }
  | { kind: "password" };

/**
 * Administrator's controls on a user card: make a manager / back to customer, a new password, block / unblock.
 * Each step is confirmed; the API refuses changes to administrators and to oneself.
 */
export function UserAdminActions({
  userId,
  role,
  blocked,
  phone,
}: {
  userId: number;
  role: "client" | "manager";
  blocked: boolean;
  phone?: string | null;
}) {
  const { t } = useI18n();
  const u = t.admin.user;
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const close = () => {
    setAction(null);
    setCredentials(null);
  };

  const run = async () => {
    if (!action) return;
    setBusy(true);
    try {
      if (action.kind === "password") {
        const response = await bff<{ data: { credentials: Credentials } }>(
          `/api/proxy/admin/users/${userId}/password`,
        );
        setCredentials(response.data.credentials);
        toast.success(u.passwordDone);
        return;
      }
      if (action.kind === "role") {
        await bff(`/api/proxy/admin/users/${userId}/role`, {
          method: "PATCH",
          body: { role: action.role },
        });
        toast.success(u.roleChanged);
      } else {
        await bff(`/api/proxy/admin/users/${userId}/${action.kind}`, {
          method: "PATCH",
        });
        toast.success(
          action.kind === "block" ? u.blockedDone : u.unblockedDone,
        );
      }
      setAction(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  const title = !action
    ? ""
    : action.kind === "password"
      ? u.newPassword
      : action.kind === "role"
        ? action.role === "manager"
          ? u.makeManager
          : u.makeClient
        : action.kind === "block"
          ? u.block
          : u.unblock;
  const text = !action
    ? ""
    : action.kind === "password"
      ? u.newPasswordText
      : action.kind === "role"
        ? action.role === "manager"
          ? u.managerText
          : u.clientText
        : action.kind === "block"
          ? u.blockText
          : "";

  return (
    <div className="space-y-2">
      {role === "client" ? (
        <Button
          className="w-full"
          onClick={() => setAction({ kind: "role", role: "manager" })}
          disabled={blocked}
        >
          <ShieldCheck className="size-4" />
          {u.makeManager}
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setAction({ kind: "role", role: "client" })}
        >
          <ShieldOff className="size-4" />
          {u.makeClient}
        </Button>
      )}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setAction({ kind: "password" })}
        disabled={blocked}
      >
        <KeyRound className="size-4" />
        {u.newPassword}
      </Button>
      {blocked ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setAction({ kind: "unblock" })}
        >
          <Unlock className="size-4" />
          {u.unblock}
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={() => setAction({ kind: "block" })}
        >
          <Ban className="size-4" />
          {u.block}
        </Button>
      )}

      <Dialog open={action !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {credentials ? (
            <>
              <DialogTitle className="text-xl font-extrabold">
                {u.passwordDone}
              </DialogTitle>
              <DialogDescription>{t.admin.credentials.title}</DialogDescription>
              <CredentialsCard credentials={credentials} phone={phone} />
              <Button variant="outline" onClick={close}>
                {t.admin.credentials.done}
              </Button>
            </>
          ) : (
            <>
              <DialogTitle className="text-xl font-extrabold">
                {title}?
              </DialogTitle>
              {text && <DialogDescription>{text}</DialogDescription>}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={close}>
                  {t.admin.common.cancel}
                </Button>
                <Button
                  onClick={() => void run()}
                  disabled={busy}
                  className={
                    action?.kind === "block"
                      ? "bg-destructive text-white hover:bg-destructive/90"
                      : undefined
                  }
                >
                  {busy && <LoaderCircle className="size-4 animate-spin" />}
                  {title}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
