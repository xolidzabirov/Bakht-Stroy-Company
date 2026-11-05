"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Star } from "lucide-react";
import { bff } from "@/shared/api/client";
import { ApiError } from "@/shared/api/http";
import type { Review } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";
import { Textarea } from "@/shared/ui/kit/textarea";

const MAX_LENGTH = 2000;

type Props = {
  slug: string;
  productName: string;
  /** The customer's earlier review: writing again changes it. */
  mine: Review | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

/** Stars from 1 to 5 and a text, both required. Real radio buttons, so the arrow keys work too. */
export function ReviewDialog({ slug, productName, mine, open, onOpenChange, onSaved }: Props) {
  const { t } = useI18n();
  const r = t.product.reviews;
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(mine?.body ?? "");
  const [errors, setErrors] = useState<{ rating?: string; body?: string; form?: string }>({});
  const [pending, setPending] = useState(false);
  const shown = hover || rating;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = {
      rating: rating < 1 ? r.ratingRequired : undefined,
      body: body.trim().length < 3 ? r.bodyRequired : undefined,
    };
    setErrors(found);
    if (found.rating || found.body) return;

    setPending(true);
    try {
      await bff(`/api/proxy/products/${encodeURIComponent(slug)}/reviews`, { body: { rating, body: body.trim() } });
      toast.success(mine ? r.saved : r.sent);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      if (!(error instanceof ApiError)) setErrors({ form: t.errors.generic });
      else setErrors({ rating: error.errors?.rating?.[0], body: error.errors?.body?.[0], form: error.errors ? undefined : error.message });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div>
          <DialogTitle>{mine ? r.edit : r.dialogTitle}</DialogTitle>
          <DialogDescription className="mt-1 line-clamp-2 text-sm text-muted-foreground">{productName}</DialogDescription>
        </div>

        <form onSubmit={submit} noValidate className="grid gap-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">{r.ratingLabel}</legend>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div role="radiogroup" aria-label={r.ratingLabel} className="flex items-center" onPointerLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} onPointerEnter={() => setHover(n)} className="cursor-pointer rounded-lg p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-95 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand">
                    <input
                      type="radio"
                      name="rating"
                      value={n}
                      checked={rating === n}
                      onChange={() => {
                        setRating(n);
                        setErrors((current) => ({ ...current, rating: undefined }));
                      }}
                      className="sr-only"
                    />
                    <Star aria-hidden className={cn("size-9 transition-colors duration-150", n <= shown ? "fill-brand text-brand" : "fill-transparent text-border")} />
                    <span className="sr-only">{r.ratings[n - 1]}</span>
                  </label>
                ))}
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{shown ? r.ratings[shown - 1] : r.pick}</span>
            </div>
            {errors.rating && (
              <p role="alert" className="mt-1.5 text-sm text-destructive">
                {errors.rating}
              </p>
            )}
          </fieldset>

          <div>
            <label htmlFor="review-body" className="mb-1.5 block text-sm font-semibold">
              {r.bodyLabel}
            </label>
            <Textarea
              id="review-body"
              value={body}
              rows={5}
              maxLength={MAX_LENGTH}
              placeholder={r.bodyPlaceholder}
              aria-invalid={Boolean(errors.body)}
              onChange={(event) => {
                setBody(event.target.value);
                setErrors((current) => ({ ...current, body: undefined }));
              }}
              className="min-h-32 rounded-xl bg-surface px-4 py-3 text-[15px]"
            />
            <div className="mt-1.5 flex items-start justify-between gap-3">
              {errors.body ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.body}
                </p>
              ) : (
                <span />
              )}
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {body.length} / {MAX_LENGTH}
              </span>
            </div>
          </div>

          {errors.form && (
            <p role="alert" className="text-sm text-destructive">
              {errors.form}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {r.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {mine ? r.save : r.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
