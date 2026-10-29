"use client";

import { useEffect } from "react";

/** Already counted during this page load (React may run effects twice in development). */
const sent = new Set<string>();

/**
 * Counts one view of a product or a post from the browser. The page itself is cached (ISR),
 * so the count cannot happen on the server; the request goes through the site's own /api/proxy.
 */
export function TrackView({ path }: { path: `/products/${string}/view` | `/news/${string}/view` }) {
  useEffect(() => {
    if (sent.has(path)) return;
    sent.add(path);
    void fetch(`/api/proxy${path}`, { method: "POST", keepalive: true }).catch(() => undefined);
  }, [path]);

  return null;
}
