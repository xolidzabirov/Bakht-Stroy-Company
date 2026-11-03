"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Links with prefetch={false} are not fetched just for scrolling past them: on a phone that spends data and time
 * on pages nobody opens. The page is fetched the moment someone aims at the link instead: the mouse over it,
 * a finger on it, the keyboard on it. One listener, whatever the number of links.
 */
export function IntentPrefetch() {
  const router = useRouter();

  useEffect(() => {
    const seen = new Set<string>();

    const onIntent = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="/"]') : null;
      const href = link?.getAttribute("href");

      if (!link || !href || link.target === "_blank" || href.startsWith("/api/") || seen.has(href)) return;

      seen.add(href);
      router.prefetch(href);
    };

    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);

    return () => {
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
    };
  }, [router]);

  return null;
}
