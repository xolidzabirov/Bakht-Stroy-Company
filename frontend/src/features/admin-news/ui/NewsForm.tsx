"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle, Plus, Search, X } from "lucide-react";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { AdminNews, AdminProduct, Product } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { formatMoney } from "@/shared/lib/format";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { Switch } from "@/shared/ui/kit/switch";
import { Textarea } from "@/shared/ui/kit/textarea";
import { type DraftMedia, NewsMediaDraft } from "./NewsMediaDraft";
import { RichTextEditor } from "./RichTextEditor";

type LinkedProduct = Pick<Product, "id" | "name"> & { image: Product["image"]; price: number };

type Values = {
  type: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  video_url: string;
  is_published: boolean;
  published_at: string;
  is_pinned: boolean;
  meta_title: string;
  meta_description: string;
};

const FIELDS = ["type", "title", "slug", "excerpt", "body", "video_url", "is_published", "published_at", "is_pinned", "meta_title", "meta_description"] as const;

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-base font-extrabold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Products shown under the post: search by name, add, remove (up to 24). */
function ProductPicker({ value, onChange }: { value: LinkedProduct[]; onChange: (products: LinkedProduct[]) => void }) {
  const { t, locale } = useI18n();
  const n = t.admin.news;
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(term.trim()), 350);
    return () => clearTimeout(timer);
  }, [term]);

  const { data: found = [], isFetching } = useQuery({
    queryKey: ["admin-news-products", query],
    queryFn: async () => (await bff<{ data: AdminProduct[] }>(`/api/proxy/admin/products?per_page=8&search=${encodeURIComponent(query)}`, { method: "GET" })).data,
    enabled: query.length >= 2,
  });
  const chosen = new Set(value.map((product) => product.id));

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((product) => (
            <li key={product.id} className="flex items-center gap-2 rounded-xl bg-muted p-2 text-sm">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image.thumb} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="size-9 shrink-0 rounded-lg bg-surface" />
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{product.name}</span>
              <button type="button" onClick={() => onChange(value.filter((item) => item.id !== product.id))} aria-label={t.admin.common.delete} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-destructive">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length < 24 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={n.productSearch}
            aria-label={n.productSearch}
            className="h-11 w-full rounded-xl border border-input bg-surface pl-10 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {isFetching && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
      )}

      {query.length >= 2 && found.length > 0 && (
        <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border">
          {found.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                disabled={chosen.has(product.id)}
                onClick={() => {
                  onChange([...value, { id: product.id, name: product.name, image: product.image, price: product.price }]);
                  setTerm("");
                }}
                className="flex w-full items-center gap-2 p-2 text-left text-sm transition hover:bg-muted disabled:opacity-40"
              >
                <Plus className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{product.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatMoney(product.price, locale)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Create / edit a post (news, promotion or article). A new post opens its edit page after saving,
 * where the cover and the gallery can be added.
 */
export function NewsForm({ news, aside }: { news?: AdminNews; aside?: React.ReactNode }) {
  const [draft, setDraft] = useState<DraftMedia>({ cover: null, gallery: [] });
  const { t } = useI18n();
  const n = t.admin.news;
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [products, setProducts] = useState<LinkedProduct[]>(
    (news?.products ?? []).map((product) => ({ id: product.id, name: product.name, image: product.image, price: product.price })),
  );
  const [productsChanged, setProductsChanged] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<Values>({
    defaultValues: {
      type: news?.type.value ?? "news",
      title: news?.title ?? "",
      slug: news?.slug ?? "",
      excerpt: news?.excerpt_raw ?? "",
      body: news?.body ?? "",
      video_url: news?.video_url ?? "",
      is_published: news?.is_published ?? false,
      published_at: toLocalInput(news?.published_at),
      is_pinned: news?.is_pinned ?? false,
      meta_title: news?.meta_title ?? "",
      meta_description: news?.meta_description ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (!values.body.trim()) return setError("body", { message: t.admin.common.required });

    const body = {
      type: values.type,
      title: values.title.trim(),
      ...(values.slug.trim() ? { slug: values.slug.trim().toLowerCase() } : {}),
      excerpt: values.excerpt.trim() || null,
      body: values.body,
      video_url: values.video_url.trim() || null,
      is_published: values.is_published,
      published_at: values.published_at ? new Date(values.published_at).toISOString() : values.is_published ? new Date().toISOString() : null,
      is_pinned: values.is_pinned,
      meta_title: values.meta_title.trim() || null,
      meta_description: values.meta_description.trim() || null,
      product_ids: products.map((product) => product.id),
    };

    try {
      if (news) {
        const { data } = await bff<{ data: AdminNews }>(`/api/proxy/admin/news/${news.id}`, { method: "PATCH", body });
        reset({ ...values, slug: data.slug, published_at: toLocalInput(data.published_at) });
        setProductsChanged(false);
        toast.success(t.admin.common.saved);
        router.refresh();
      } else {
        const { data } = await bff<{ data: AdminNews }>("/api/proxy/admin/news", { body });
        // Photos picked before saving go up right after the post exists.
        if (draft.cover) {
          const form = new FormData();
          form.append("image", draft.cover);
          await bff(`/api/proxy/admin/news/${data.id}/cover`, { body: form }).catch(() => toast.error(t.errors.generic));
        }
        if (draft.gallery.length > 0) {
          const form = new FormData();
          draft.gallery.forEach((file) => form.append("images[]", file));
          await bff(`/api/proxy/admin/news/${data.id}/gallery`, { body: form }).catch(() => toast.error(t.errors.generic));
        }
        toast.success(n.created);
        router.replace(routes.adminNewsEdit(data.id));
      }
    } catch (error) {
      setFormError(applyApiErrors(error, setError, FIELDS, t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {formError && <FormAlert>{formError}</FormAlert>}

        <Section title={n.main}>
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <Field label={n.type}>
              {(id) => (
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={id} className="h-12 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(n.types).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </Field>
            <Field label={n.newsTitle} error={errors.title?.message}>
              {(id, describedBy) => (
                <TextInput id={id} placeholder={n.titlePlaceholder} aria-invalid={Boolean(errors.title)} aria-describedby={describedBy} {...register("title", { required: t.admin.common.required, minLength: { value: 3, message: t.admin.common.required } })} />
              )}
            </Field>
          </div>
          <Field label={n.excerpt} error={errors.excerpt?.message} hint={n.excerptHint}>
            {(id, describedBy) => <Textarea id={id} rows={2} maxLength={500} aria-describedby={describedBy} className="rounded-xl" {...register("excerpt")} />}
          </Field>
          <Field label={n.body} error={errors.body?.message}>
            {(id) => <Controller control={control} name="body" render={({ field }) => <RichTextEditor id={id} label={n.body} value={field.value} onChange={field.onChange} invalid={Boolean(errors.body)} />} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={n.videoUrl} error={errors.video_url?.message} hint={n.videoHint}>
              {(id, describedBy) => <TextInput id={id} type="url" placeholder="https://www.youtube.com/watch?v=" aria-describedby={describedBy} {...register("video_url")} />}
            </Field>
            <Field label={n.slug} error={errors.slug?.message} hint={t.admin.product.slugHint}>
              {(id, describedBy) => <TextInput id={id} placeholder="skidka-na-tsement" aria-describedby={describedBy} {...register("slug")} />}
            </Field>
          </div>
        </Section>

        <Section title={n.seo}>
          <Field label={n.metaTitle} error={errors.meta_title?.message}>
            {(id, describedBy) => <TextInput id={id} maxLength={200} aria-describedby={describedBy} {...register("meta_title")} />}
          </Field>
          <Field label={n.metaDescription} error={errors.meta_description?.message}>
            {(id, describedBy) => <Textarea id={id} rows={2} maxLength={300} aria-describedby={describedBy} className="rounded-xl" {...register("meta_description")} />}
          </Field>
        </Section>
      </div>

      <div className="space-y-4">
        <Section title={n.publishing}>
          <Controller
            control={control}
            name="is_published"
            render={({ field }) => (
              <label className="flex items-start justify-between gap-4">
                <span>
                  <b className="block text-sm">{n.isPublished}</b>
                  <span className="text-xs text-muted-foreground">{n.isPublishedHint}</span>
                </span>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={n.isPublished} />
              </label>
            )}
          />
          <Field label={n.publishedAt} error={errors.published_at?.message} hint={n.publishedAtHint}>
            {(id, describedBy) => <TextInput id={id} type="datetime-local" aria-describedby={describedBy} {...register("published_at")} />}
          </Field>
          <Controller
            control={control}
            name="is_pinned"
            render={({ field }) => (
              <label className="flex items-center justify-between gap-4 border-t border-border pt-3">
                <b className="text-sm">{n.isPinned}</b>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={n.isPinned} />
              </label>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting || (Boolean(news) && !isDirty && !productsChanged)}>
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            {news ? t.admin.common.save : t.admin.common.create}
          </Button>
        </Section>

        <Section title={n.products} hint={n.productsHint}>
          <ProductPicker
            value={products}
            onChange={(next) => {
              setProducts(next);
              setProductsChanged(true);
            }}
          />
        </Section>

        {news ? aside : <NewsMediaDraft value={draft} onChange={setDraft} />}
      </div>
    </form>
  );
}
