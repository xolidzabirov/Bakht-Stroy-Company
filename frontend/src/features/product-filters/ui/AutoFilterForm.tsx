"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { buttonClasses } from "@/shared/ui";

/** A pause in typing before the catalog changes; a tick in a box applies at once. */
const TYPING_PAUSE = 500;

/** The filters of an address, in one order: this is how two addresses are compared. */
function filtersOf(params: URLSearchParams): string {
  const query = new URLSearchParams(params);
  query.delete("page");
  query.sort();

  return query.toString();
}

/**
 * The filters apply by themselves: the address changes, the page stays, the cursor stays in the field.
 * Without JavaScript it is still a plain GET form (FiltersForm adds its button for that case).
 */
export function AutoFilterForm({ action, resetLabel, className, children }: { action: string; resetLabel: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, startTransition] = useTransition();
  const fromAddress = filtersOf(useSearchParams());
  const [known, setKnown] = useState(fromAddress);
  const [applied, setApplied] = useState(fromAddress);
  const [generation, setGeneration] = useState(0);

  // The fields keep what was typed. When the address changed some other way (Сбросить, a link to the catalog),
  // they are built anew from the new page's values; when it changed from here, they stay, with the cursor in them.
  if (fromAddress !== known && !pending) {
    setKnown(fromAddress);
    if (fromAddress !== applied) {
      setApplied(fromAddress);
      setGeneration(generation + 1);
    }
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const apply = () => {
    if (!form.current) return;

    const query = new URLSearchParams();

    for (const [name, value] of new FormData(form.current)) {
      if (typeof value === "string" && value.trim()) query.set(name, value.trim());
    }

    // "от 100 до 5" is on its way to "до 500": wait for the rest of the number.
    const from = Number(query.get("price_from"));
    const to = Number(query.get("price_to"));
    if (query.has("price_from") && query.has("price_to") && to <= from) return;

    const search = filtersOf(query);
    if (search === filtersOf(new URLSearchParams(window.location.search))) return;

    setApplied(search);
    startTransition(() => router.replace(search ? `${action}?${search}` : action, { scroll: false }));
  };

  const schedule = (event: React.FormEvent<HTMLFormElement>) => {
    const typing = event.target instanceof HTMLInputElement && event.target.type !== "checkbox";

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(apply, typing ? TYPING_PAUSE : 0);
  };

  const reset = (event: React.MouseEvent) => {
    event.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    startTransition(() => router.replace(action, { scroll: false }));
  };

  return (
    <form
      key={generation}
      ref={form}
      action={action}
      className={className}
      onChange={schedule}
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        apply();
      }}
    >
      {children}
      <Link prefetch={false} href={action} onClick={reset} className={buttonClasses({ variant: "outline", className: "w-full" })}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
        {resetLabel}
      </Link>
    </form>
  );
}
