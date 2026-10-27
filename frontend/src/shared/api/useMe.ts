"use client";

import { useQuery } from "@tanstack/react-query";
import { useSessionName } from "@/shared/lib/useSession";
import { bff } from "./client";
import type { CurrentUser } from "./session";

export const meKey = ["me"] as const;

/** The signed-in user in the browser (name, contacts, role); null for guests. Loaded once and shared. */
export function useMe() {
  const signedIn = useSessionName() !== null;

  const query = useQuery({
    queryKey: meKey,
    queryFn: async () => (await bff<{ data: CurrentUser }>("/api/proxy/auth/me", { method: "GET" })).data,
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });

  return { ...query, data: signedIn ? query.data : undefined, signedIn, isStaff: Boolean(signedIn && query.data?.is_staff) };
}
