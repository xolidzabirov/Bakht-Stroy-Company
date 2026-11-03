"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Eye, EyeOff, LoaderCircle, Star, Trash2 } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { useAdminI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

function useApiError() {
  const { t } = useAdminI18n();
  return (error: unknown) => toast.error(error instanceof ApiError ? error.message : t.errors.generic);
}

/** Stock right on the card: a quiet line with a coloured dot; type a number, Enter or ✓ saves it, Esc puts it back. */
export function StockEditor({ productId, stock, unit, low }: { productId: number; stock: number; unit: string; low: boolean }) {
  const { t } = useAdminI18n();
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
    <label className="-mx-2 flex h-9 cursor-text items-center gap-2 rounded-lg px-2 transition hover:bg-muted focus-within:bg-muted focus-within:ring-2 focus-within:ring-ring/40">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", stock === 0 ? "bg-destructive" : low ? "bg-amber-500" : "bg-success")} />
      <span className={cn("text-xs font-medium", low || stock === 0 ? "text-destructive" : "text-muted-foreground")}>
        {t.admin.products.stock}
        {low && ` · ${t.admin.products.lowStock}`}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder="0"
        aria-label={t.admin.products.stock}
        onChange={(event) => setValue(event.target.value.replace(/\D/g, ""))}
        onKeyDown={(event) => {
          if (event.key === "Enter") void save();
          if (event.key === "Escape") setValue(String(stock));
        }}
        onBlur={() => value === "" && setValue(String(stock))}
        className="ml-auto h-8 w-16 min-w-0 bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
      />
      <span className="min-w-6 text-xs text-muted-foreground">{unit}</span>
      <button
        type="button"
        onClick={() => void save()}
        disabled={!changed || saving}
        aria-label={t.admin.common.save}
        className={cn("grid shrink-0 place-items-center overflow-hidden rounded-lg bg-primary text-primary-foreground transition-all", changed ? "size-7 opacity-100" : "pointer-events-none size-0 opacity-0")}
      >
        {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
      </button>
    </label>
  );
}

/**
 * "На сайте" and "Хит" on the card: a chip that says what it does (saved immediately, the tooltip explains it).
 * is_active — customers see the product; is_featured — it goes to the "Хиты" block on the home page.
 */
export function ProductFlag({ productId, field, value, label, offLabel, hint }: { productId: number; field: "is_active" | "is_featured"; value: boolean; label: string; offLabel: string; hint: string }) {
  const router = useRouter();
  const onError = useApiError();
  const [checked, setChecked] = useState(value);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !checked;
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

  const Icon = field === "is_featured" ? Star : checked ? Eye : EyeOff;

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={saving}
      aria-pressed={checked}
      title={hint}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition active:scale-95 disabled:opacity-60",
        !checked && "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
        checked && field === "is_active" && "border-transparent bg-success/10 text-success",
        checked && field === "is_featured" && "border-transparent bg-brand/20 text-foreground",
      )}
    >
      <Icon className={cn("size-3.5", checked && field === "is_featured" && "fill-brand text-brand")} />
      {checked ? label : offLabel}
    </button>
  );
}

/** Delete with a confirmation; the product leaves the catalog, orders keep their copy. */
export function DeleteProduct({ productId, name, afterDelete, compact = true }: { productId: number; name: string; afterDelete?: string; compact?: boolean }) {
  const { t } = useAdminI18n();
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
