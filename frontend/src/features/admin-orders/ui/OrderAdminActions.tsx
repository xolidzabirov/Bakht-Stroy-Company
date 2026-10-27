"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CircleAlert, LoaderCircle, MessageCircle, XCircle } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";
import { Textarea } from "@/shared/ui/kit/textarea";

type Status = { value: string; label: string };

/**
 * Next status buttons (only the allowed transitions, from the API), each confirmed in a dialog
 * with an optional comment for the customer. "On the way" stays locked until the order is paid.
 */
export function OrderStatusActions({ orderId, next, paid }: { orderId: number; next: Status[]; paid: boolean }) {
  const { t } = useI18n();
  const o = t.admin.order;
  const router = useRouter();
  const [target, setTarget] = useState<Status | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const forward = next.filter((status) => status.value !== "cancelled");
  const cancel = next.find((status) => status.value === "cancelled");
  const locked = (status: Status) => status.value === "delivering" && !paid;

  const submit = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await bff(`/api/proxy/admin/orders/${orderId}/status`, { method: "PATCH", body: { status: target.value, comment: comment.trim() || null } });
      toast.success(o.statusChanged);
      setTarget(null);
      setComment("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  if (next.length === 0) return <p className="text-sm text-muted-foreground">{o.finished}</p>;

  return (
    <div className="space-y-2">
      {forward.map((status) => (
        <Button key={status.value} className="w-full justify-between" disabled={locked(status)} onClick={() => setTarget(status)}>
          {fmt(o.moveTo, { status: status.label })}
          <ArrowRight className="size-4" />
        </Button>
      ))}
      {forward.some(locked) && (
        <p className="flex gap-2 rounded-xl bg-brand-soft p-3 text-xs font-medium">
          <CircleAlert className="size-4 shrink-0" />
          {o.unpaidHint}
        </p>
      )}
      {cancel && (
        <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setTarget(cancel)}>
          <XCircle className="size-4" />
          {o.cancel}
        </Button>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{target && fmt(o.confirmTitle, { status: target.label })}</DialogTitle>
          <DialogDescription>{target?.value === "cancelled" ? o.confirmCancel : o.confirmText}</DialogDescription>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>{o.commentLabel}</span>
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={o.commentPlaceholder} maxLength={500} rows={3} className="font-normal" />
          </label>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTarget(null)}>
              {t.admin.common.cancel}
            </Button>
            <Button onClick={() => void submit()} disabled={busy} className={target?.value === "cancelled" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}>
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {target?.value === "cancelled" ? o.cancel : t.admin.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Mark paid / refund / back to waiting — the payment status of the order. */
export function OrderPaymentActions({ orderId, status, closed }: { orderId: number; status: string; closed: boolean }) {
  const { t } = useI18n();
  const o = t.admin.order;
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const change = async (value: string) => {
    setBusy(value);
    try {
      await bff(`/api/proxy/admin/orders/${orderId}/payment`, { method: "PATCH", body: { payment_status: value } });
      toast.success(o.paymentChanged);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(null);
    }
  };

  const options =
    status === "pending" ? [{ value: "paid", label: o.markPaid, primary: true }] : status === "paid" ? [{ value: "refunded", label: o.markRefunded }, { value: "pending", label: o.markPending }] : [{ value: "pending", label: o.markPending }];

  if (closed && status !== "paid") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button key={option.value} size="sm" variant={"primary" in option ? "primary" : "outline"} disabled={busy !== null} onClick={() => void change(option.value)}>
          {busy === option.value && <LoaderCircle className="size-4 animate-spin" />}
          {option.label}
        </Button>
      ))}
    </div>
  );
}

/** Opens (or starts) the chat with this customer in the inbox. */
export function ChatWithCustomer({ userId }: { userId: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    try {
      const { data } = await bff<{ data: { id: number } }>("/api/proxy/admin/chats", { body: { user_id: userId } });
      router.push(routes.adminChat(data.id));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={() => void open()} disabled={busy}>
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
      {t.admin.common.writeChat}
    </Button>
  );
}
