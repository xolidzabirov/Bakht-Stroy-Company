"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, FolderPlus, FolderTree, ImagePlus, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { Switch } from "@/shared/ui/kit/switch";
import { Textarea } from "@/shared/ui/kit/textarea";

type Editing = { category: Category | null; parentId: number | null };
const ROOT = "root";

/**
 * The two-level catalog tree: order with arrows, add a subcategory, edit in a dialog (with the image),
 * delete only empty categories (the API explains why otherwise).
 */
export function CategoryManager({ tree }: { tree: Category[] }) {
  const { t } = useI18n();
  const c = t.admin.categories;
  const router = useRouter();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (error: unknown) => toast.error(error instanceof ApiError ? error.message : t.errors.generic);

  /** Swap with the neighbour and save the order of the whole level. */
  const move = async (siblings: Category[], index: number, step: -1 | 1) => {
    const target = index + step;
    if (target < 0 || target >= siblings.length) return;
    const ordered = [...siblings];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setBusy(true);
    try {
      await bff("/api/proxy/admin/categories/reorder", { method: "PATCH", body: { items: ordered.map((item, i) => ({ id: item.id, sort_order: (i + 1) * 10 })) } });
      toast.success(c.orderSaved);
      router.refresh();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await bff(`/api/proxy/admin/categories/${deleting.id}`, { method: "DELETE" });
      toast.success(t.admin.common.deleted);
      setDeleting(null);
      router.refresh();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const row = (category: Category, siblings: Category[], index: number, child: boolean) => (
    <div className={cn("flex items-center gap-3 px-4 py-3", child && "pl-8 sm:pl-14")}>
      {category.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={category.image} alt="" className={cn("shrink-0 rounded-xl bg-muted object-cover", child ? "size-10" : "size-12")} />
      ) : (
        <span className={cn("grid shrink-0 place-items-center rounded-xl bg-muted", child ? "size-10" : "size-12")}>
          <FolderTree className="size-5 text-muted-foreground" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <Link href={`${routes.adminProducts}?category=${category.slug}`} className={cn("hover:underline", child ? "font-semibold" : "font-bold", !category.is_active && "text-muted-foreground")}>
            {category.name}
          </Link>
          {!category.is_active && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{t.admin.common.hidden}</span>}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          /{category.slug} · {fmt(c.products, { count: String(category.products_count ?? 0) })}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        <IconButton label={c.moveUp} disabled={busy || index === 0} onClick={() => void move(siblings, index, -1)}>
          <ArrowUp className="size-4" />
        </IconButton>
        <IconButton label={c.moveDown} disabled={busy || index === siblings.length - 1} onClick={() => void move(siblings, index, 1)}>
          <ArrowDown className="size-4" />
        </IconButton>
        {!child && (
          <IconButton label={c.addChild} onClick={() => setEditing({ category: null, parentId: category.id })}>
            <FolderPlus className="size-4" />
          </IconButton>
        )}
        <IconButton label={t.admin.common.edit} onClick={() => setEditing({ category, parentId: category.parent_id })}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton label={t.admin.common.delete} danger onClick={() => setDeleting(category)}>
          <Trash2 className="size-4" />
        </IconButton>
      </span>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({ category: null, parentId: null })}>
          <Plus className="size-4" />
          {c.add}
        </Button>
      </div>

      {tree.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-muted-foreground">{c.empty}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {tree.map((root, index) => (
            <li key={root.id}>
              {row(root, tree, index, false)}
              {root.children && root.children.length > 0 && (
                <ul className="divide-y divide-border/60 border-t border-border/60 bg-muted/30">
                  {root.children.map((child, childIndex) => (
                    <li key={child.id}>{row(child, root.children!, childIndex, true)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
          {editing && (
            <CategoryForm
              key={editing.category?.id ?? `new-${editing.parentId}`}
              category={editing.category}
              parentId={editing.parentId}
              roots={tree}
              onSaved={(saved, created) => {
                router.refresh();
                // A new category stays open, so its image can be added right away.
                if (created) setEditing({ category: saved, parentId: saved.parent_id });
                else setEditing(null);
              }}
              onClose={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{deleting && fmt(t.admin.common.confirmDelete, { name: deleting.name })}</DialogTitle>
          <DialogDescription>{c.deleteText}</DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
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

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg text-muted-foreground transition disabled:pointer-events-none disabled:opacity-30",
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

type Values = { name: string; slug: string; parent: string; description: string; is_active: boolean };

function CategoryForm({
  category,
  parentId,
  roots,
  onSaved,
  onClose,
}: {
  category: Category | null;
  parentId: number | null;
  roots: Category[];
  onSaved: (category: Category, created: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const c = t.admin.categories;
  const [formError, setFormError] = useState<string | null>(null);
  const hasChildren = Boolean(category?.children?.length);
  const parents = roots.filter((root) => root.id !== category?.id);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      parent: parentId ? String(parentId) : ROOT,
      description: category?.description ?? "",
      is_active: category?.is_active ?? true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      name: values.name.trim(),
      ...(values.slug.trim() ? { slug: values.slug.trim().toLowerCase() } : {}),
      parent_id: values.parent === ROOT ? null : Number(values.parent),
      description: values.description.trim() || null,
      is_active: values.is_active,
    };

    try {
      const { data } = category
        ? await bff<{ data: Category }>(`/api/proxy/admin/categories/${category.id}`, { method: "PATCH", body })
        : await bff<{ data: Category }>("/api/proxy/admin/categories", { body });
      toast.success(t.admin.common.saved);
      onSaved(data, !category);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["name", "slug", "description"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <DialogTitle className="text-xl font-extrabold">{category ? c.editTitle : c.newTitle}</DialogTitle>
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label={c.name} error={errors.name?.message}>
        {(id, describedBy) => <TextInput id={id} placeholder={c.namePlaceholder} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy} {...register("name", { required: t.admin.common.required })} />}
      </Field>
      <Field label={c.slug} error={errors.slug?.message} hint={t.admin.product.slugHint}>
        {(id, describedBy) => <TextInput id={id} placeholder="tsement-i-beton" aria-describedby={describedBy} {...register("slug")} />}
      </Field>
      <Field label={c.parent}>
        {(id) => (
          <Controller
            control={control}
            name="parent"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={hasChildren}>
                <SelectTrigger id={id} className="h-12 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROOT}>{c.root}</SelectItem>
                  {parents.map((root) => (
                    <SelectItem key={root.id} value={String(root.id)}>
                      {root.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
      <Field label={c.description} error={errors.description?.message}>
        {(id, describedBy) => <Textarea id={id} rows={3} aria-describedby={describedBy} className="rounded-xl" {...register("description")} />}
      </Field>
      <Controller
        control={control}
        name="is_active"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-4 rounded-xl bg-muted px-4 py-3">
            <b className="text-sm">{c.isActive}</b>
            <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={c.isActive} />
          </label>
        )}
      />

      {category && <CategoryImage category={category} />}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t.admin.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          {category ? t.admin.common.save : t.admin.common.create}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CategoryImage({ category }: { category: Category }) {
  const { t } = useI18n();
  const c = t.admin.categories;
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(category.image);
  const [busy, setBusy] = useState(false);

  const run = async (request: () => Promise<{ data: Category } | void>) => {
    setBusy(true);
    try {
      const result = await request();
      setImage(result ? result.data.image : null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  const upload = (file: File) => {
    const form = new FormData();
    form.append("image", file);
    void run(() => bff<{ data: Category }>(`/api/proxy/admin/categories/${category.id}/image`, { body: form }));
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{c.image}</p>
      <div className="flex items-center gap-3">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-20 rounded-xl bg-muted object-cover" />
        ) : (
          <span className="grid size-20 place-items-center rounded-xl bg-muted">
            <ImagePlus className="size-6 text-muted-foreground" />
          </span>
        )}
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              {c.uploadImage}
            </Button>
            {image && (
              <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => bff<void>(`/api/proxy/admin/categories/${category.id}/image`, { method: "DELETE" }))}>
                <X className="size-4" />
                {c.removeImage}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{c.imageHint}</p>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
