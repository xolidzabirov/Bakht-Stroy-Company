"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, LoaderCircle, Trash2 } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";
import { Switch } from "@/shared/ui/kit/switch";

function useApiError() {
  const { t } = useI18n();
  return (error: unknown) => toast.error(error instanceof ApiError ? error.message : t.errors.generic);
}

/** Stock right in the table: type a number, Enter or ✓ saves it. */
export function StockEditor({ productId, stock, unit, low }: { productId: number; stock: number; unit: string; low: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const onError = useApiError();
  const [value, setValue] = useState(String(stock));
  const [saving, setSaving] = useState(false);
  const changed = value !== String(stock) && /^\d+$/.test(value);

  const save = async () => {
    if (!changed) return;
    setSaving(true);
    try {
      await bff(`/api/proxy/admin/products/${productId}/stock`, { method: "PATCH", body: { stock: Number(value) } });
      toast.success(t.admin.products.stockSaved);
      router.refresh();
    } catch (error) {
      onError(error);
      setValue(String(stock));
    } finally {
      setSaving(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        aria-label={t.admin.products.stock}
        onChange={(event) => setValue(event.target.value.replace(/\D/g, ""))}
        onKeyDown={(event) => event.key === "Enter" && void save()}
        className={cn(
          "h-9 w-20 rounded-lg border bg-surface px-2 text-right text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          low ? "border-destructive/50 text-destructive" : "border-border",
        )}
      />
      <span className="w-10 text-xs text-muted-foreground">{unit}</span>
      {changed && (
        <button type="button" onClick={() => void save()} disabled={saving} aria-label={t.admin.common.save} className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
        </button>
      )}
    </span>
  );
}

/** Visible / hit switches in the table (saved immediately). */
export function ProductFlag({ productId, field, value, label }: { productId: number; field: "is_active" | "is_featured"; value: boolean; label: string }) {
  const router = useRouter();
  const onError = useApiError();
  const [checked, setChecked] = useState(value);
  const [saving, setSaving] = useState(false);

  const toggle = async (next: boolean) => {
    setChecked(next);
    setSaving(true);
    try {
      await bff(`/api/proxy/admin/products/${productId}`, { method: "PATCH", body: { [field]: next } });
      router.refresh();
    } catch (error) {
      setChecked(!next);
      onError(error);
    } finally {
      setSaving(false);
    }
  };

  return <Switch checked={checked} onCheckedChange={(next) => void toggle(next)} disabled={saving} aria-label={label} />;
}

/** Delete with a confirmation; the product leaves the catalog, orders keep their copy. */
export function DeleteProduct({ productId, name, afterDelete, compact = true }: { productId: number; name: string; afterDelete?: string; compact?: boolean }) {
  const { t } = useI18n();
  const c = t.admin.common;
  const router = useRouter();
  const onError = useApiError();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await bff(`/api/proxy/admin/products/${productId}`, { method: "DELETE" });
      toast.success(c.deleted);
      setOpen(false);
      if (afterDelete) router.replace(afterDelete);
      router.refresh();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {compact ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={c.delete} title={c.delete} className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="size-4" />
        </button>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)} className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
          {c.delete}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{fmt(c.confirmDelete, { name })}</DialogTitle>
          <DialogDescription>{t.admin.products.deleteText}</DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {c.cancel}
            </Button>
            <Button onClick={() => void remove()} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {c.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
