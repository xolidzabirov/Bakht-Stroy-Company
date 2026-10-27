"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw, ServerCrash } from "lucide-react";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { Button } from "@/shared/ui";

/**
 * Any page that failed on the server (usually the API is restarting or unreachable):
 * a calm message and "try again" instead of the bare browser error.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft">
          <ServerCrash className="size-8" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">{e.title}</h1>
        <p className="mt-2 text-muted-foreground">{e.text}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={retry} disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            {e.retry}
          </Button>
          <Link href={routes.home} className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold transition hover:bg-muted">
            {t.notFound.home}
          </Link>
        </div>
        {error.digest && <p className="mt-6 font-mono text-xs text-muted-foreground">#{error.digest}</p>}
      </div>
    </main>
  );
}
