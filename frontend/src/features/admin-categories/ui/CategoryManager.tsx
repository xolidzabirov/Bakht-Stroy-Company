"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Boxes, CornerDownRight, EyeOff, FolderPlus, FolderTree, ImagePlus, LoaderCircle, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/kit/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { Switch } from "@/shared/ui/kit/switch";
import { Textarea } from "@/shared/ui/kit/textarea";
import { EmptyState, PageHeader } from "@/shared/ui/admin/PageHeader";

type Editing = { category: Category | null; parentId: number | null };
const ROOT = "root";

/**
 * The two-level catalog tree: order with arrows, add a subcategory, edit in a dialog (with the image),
 * delete only empty categories (the API explains why otherwise).
 */
export function CategoryManager({ tree, header }: { tree: Category[]; header: { title: string; description: string } }) {
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

  /** One category line: picture, name and facts, then order arrows, "edit" and the "⋯" menu. */
  const row = (category: Category, siblings: Category[], index: number, child: boolean) => (
    <div className={cn("flex items-center gap-3", child ? "py-2.5 pl-4 pr-3 sm:pl-6" : "p-4")}>
      {child && <CornerDownRight aria-hidden className="size-4 shrink-0 text-border" />}
      {category.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={category.image} alt="" loading="lazy" className={cn("shrink-0 rounded-xl bg-muted object-cover ring-1 ring-border", child ? "size-9" : "size-14", !category.is_active && "opacity-50 grayscale")} />
      ) : (
        <span className={cn("grid shrink-0 place-items-center rounded-xl bg-muted ring-1 ring-border", child ? "size-9" : "size-14")}>
          <FolderTree className={cn("text-muted-foreground", child ? "size-4" : "size-5")} />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <Link
            href={`${routes.adminProducts}?category=${category.slug}`}
            className={cn("truncate hover:underline", child ? "text-sm font-semibold" : "font-display text-base font-bold", !category.is_active && "text-muted-foreground")}
          >
            {category.name}
          </Link>
          {!category.is_active && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              <EyeOff className="size-3" />
              {t.admin.common.hidden}
            </span>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="font-mono">/{category.slug}</span>
          {!child && Boolean(category.children?.length) && (
            <>
              <span aria-hidden>·</span>
              {fmt(c.subcategories, { count: String(category.children!.length) })}
            </>
          )}
        </span>
      </span>

      <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums sm:inline">{fmt(c.products, { count: String(category.products_count ?? 0) })}</span>

      <span className="flex shrink-0 items-center gap-1">
        {/* Order: a small segmented control, like in design tools. */}
        <span className="hidden items-center rounded-lg border border-border sm:flex">
          <IconButton label={c.moveUp} disabled={busy || index === 0} onClick={() => void move(siblings, index, -1)} className="rounded-r-none">
            <ArrowUp className="size-4" />
          </IconButton>
          <span aria-hidden className="h-5 w-px bg-border" />
          <IconButton label={c.moveDown} disabled={busy || index === siblings.length - 1} onClick={() => void move(siblings, index, 1)} className="rounded-l-none">
            <ArrowDown className="size-4" />
          </IconButton>
        </span>
        <IconButton label={t.admin.common.edit} onClick={() => setEditing({ category, parentId: category.parent_id })}>
          <Pencil className="size-4" />
        </IconButton>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={t.admin.common.more} title={t.admin.common.more} className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
            {/* On phones the order arrows live here. */}
            <DropdownMenuItem className="gap-2.5 rounded-lg sm:hidden" disabled={busy || index === 0} onSelect={() => void move(siblings, index, -1)}>
              <ArrowUp className="size-4" />
              {c.moveUp}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2.5 rounded-lg sm:hidden" disabled={busy || index === siblings.length - 1} onSelect={() => void move(siblings, index, 1)}>
              <ArrowDown className="size-4" />
              {c.moveDown}
            </DropdownMenuItem>
            {!child && (
              <DropdownMenuItem className="gap-2.5 rounded-lg" onSelect={() => setEditing({ category: null, parentId: category.id })}>
                <FolderPlus className="size-4" />
                {c.addChild}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className="gap-2.5 rounded-lg">
              <Link href={`${routes.adminProducts}?category=${category.slug}`}>
                <Boxes className="size-4" />
                {c.showProducts}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2.5 rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={() => setDeleting(category)}>
              <Trash2 className="size-4" />
              {t.admin.common.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </div>
  );

  return (
    <>
      <PageHeader
        icon={FolderTree}
        title={header.title}
        description={header.description}
        actions={
          <Button onClick={() => setEditing({ category: null, parentId: null })}>
            <Plus className="size-4" />
            {c.add}
          </Button>
        }
      />

      {tree.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title={c.empty}
          action={
            <Button onClick={() => setEditing({ category: null, parentId: null })}>
              <Plus className="size-4" />
              {c.add}
            </Button>
          }
        />
      ) : (
        <ul className="grid items-start gap-4 xl:grid-cols-2">
          {tree.map((root, index) => (
            <li
              key={root.id}
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              className="animate-in overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow fade-in-0 slide-in-from-bottom-2 fill-mode-both hover:shadow-md"
            >
              {row(root, tree, index, false)}
              {root.children && root.children.length > 0 && (
                <ul className="divide-y divide-border/70 border-t border-border bg-muted/40">
                  {root.children.map((child, childIndex) => (
                    <li key={child.id}>{row(child, root.children!, childIndex, true)}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setEditing({ category: null, parentId: root.id })}
                className="flex w-full items-center gap-2 border-t border-dashed border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted/60 hover:text-foreground sm:px-6"
              >
                <Plus className="size-3.5" />
                {c.addChild}
              </button>
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
              onSaved={() => {
                router.refresh();
                setEditing(null);
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

function IconButton({ label, onClick, disabled, className, children }: { label: string; onClick: () => void; disabled?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn("grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30", className)}
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
  onSaved: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const c = t.admin.categories;
  const [formError, setFormError] = useState<string | null>(null);
  const [draftImage, setDraftImage] = useState<File | null>(null);
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
      // A picture chosen for a new category goes up right after the category exists.
      if (draftImage) {
        const form = new FormData();
        form.append("image", draftImage);
        await bff(`/api/proxy/admin/categories/${data.id}/image`, { body: form }).catch((error) => toast.error(error instanceof ApiError ? error.message : t.errors.generic));
      }
      toast.success(t.admin.common.saved);
      onSaved();
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

      {category ? <CategoryImage category={category} /> : <CategoryImageDraft file={draftImage} onChange={setDraftImage} />}

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

/** The picture of a category that is not saved yet: it waits in the browser and is uploaded after "Создать". */
function CategoryImageDraft({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const { t } = useI18n();
  const c = t.admin.categories;
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{c.image}</p>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-20 rounded-xl bg-muted object-cover" />
        ) : (
          <span className="grid size-20 place-items-center rounded-xl bg-muted">
            <ImagePlus className="size-6 text-muted-foreground" />
          </span>
        )}
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
              <ImagePlus className="size-4" />
              {c.uploadImage}
            </Button>
            {file && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
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
          const picked = event.target.files?.[0];
          if (picked && picked.size > 5 * 1024 * 1024) toast.error(c.imageHint);
          else if (picked) onChange(picked);
          event.target.value = "";
        }}
      />
    </div>
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
