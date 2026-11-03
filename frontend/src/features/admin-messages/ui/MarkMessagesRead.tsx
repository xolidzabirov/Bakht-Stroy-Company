"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { bff } from "@/shared/api/client";

/**
 * Opening the page counts as reading: everything is marked as read and the menu badge goes away.
 * The cards keep their "new" look until the next visit, so it stays clear what has just arrived.
 * If the request fails, the badge simply stays and the next visit tries again.
 */
export function MarkMessagesRead({ unread }: { unread: number }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (unread === 0) return;

    void bff("/api/proxy/admin/messages/read-all", { method: "POST" })
      .then(() => queryClient.invalidateQueries({ queryKey: ["admin-badge-messages"] }))
      .catch(() => null);
  }, [unread, queryClient]);

  return null;
}
