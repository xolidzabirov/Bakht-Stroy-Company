"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Phone, RotateCcw, ServerCrash } from "lucide-react";
import { routes, site } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { formatPhone } from "@/shared/lib/format";
import { Button, ButtonLink } from "@/shared/ui";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Where "back" leads and which text fits: the shop, the account or the admin panel. */
  variant?: "shop" | "account" | "admin";
  /** The whole screen (when the section layout itself failed) instead of the content area. */
  fullScreen?: boolean;
};

/**
 * A page that failed to load (usually the API is waking up or unreachable): a calm explanation,
 * "Повторить" that refetches the data, the way back, and the error code to tell the shop.
 */
export function ErrorScreen({ error, reset, variant = "shop", fullScreen = false }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const e = t.serverError;

  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  const back =
    variant === "admin"
      ? { href: routes.admin, label: e.toDashboard }
      : variant === "account"
        ? { href: routes.account, label: e.toAccount }
        : { href: routes.home, label: t.notFound.home };

  return (
    <section role="alert" className={cn("grid place-items-center px-4 py-16 text-center", fullScreen ? "min-h-dvh" : "min-h-[60vh]")}>
      <div className="max-w-md animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <span className="relative mx-auto grid size-20 place-items-center rounded-3xl bg-ink text-brand shadow-xl shadow-black/10 dark:bg-white/10">
          <ServerCrash className="size-9" />
          <span aria-hidden className="absolute -right-1 -top-1 flex size-4">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-4 rounded-full border-2 border-background bg-brand" />
          </span>
        </span>
        <h1 className="mt-6 text-2xl font-extrabold sm:text-3xl">{e.title}</h1>
        <p className="mt-2 text-muted-foreground">{variant === "admin" ? e.adminText : e.text}</p>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Button onClick={retry} disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            {e.retry}
          </Button>
          <ButtonLink href={back.href} variant="outline">
            {back.label}
          </ButtonLink>
          {variant === "shop" && (
            <a
              href={`tel:${site.phones[0]}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Phone className="size-4" />
              {formatPhone(site.phones[0])}
            </a>
          )}
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-muted-foreground">
            {e.code}: <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono">#{error.digest}</code>
          </p>
        )}
      </div>
    </section>
  );
}
