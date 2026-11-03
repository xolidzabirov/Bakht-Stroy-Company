import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { AUTH_COOKIE } from "@/shared/config/auth";
import { apiFetch, ApiError } from "./http";
import type { components } from "./schema";

export type CurrentUser = components["schemas"]["UserResource"];

/**
 * Signed-in user for Server Components (account, checkout). Null for guests and expired tokens.
 * Always fresh — never cached between users; within one request (layout, metadata, page) it is asked once.
 */
/** The visitor's address for the API's rate limit: requests from the site's server would otherwise all count as one. */
async function visitorHeaders(): Promise<Record<string, string>> {
  const forwardedFor = (await headers()).get("x-forwarded-for");

  return forwardedFor ? { "X-Forwarded-For": forwardedFor } : {};
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  if (!token) return null;

  try {
    const response = await apiFetch<{ data: CurrentUser }>("/auth/me", { token, cache: "no-store", headers: await visitorHeaders() });

    return response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
});

/** API token of the visitor for server-side requests (account, cart, favorites pages). */
export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE)?.value;
}

/**
 * GET from the API as the signed-in user (account pages). Never cached between users.
 * A token that stopped working on the way sends the visitor for a new one and back to this page.
 */
export async function userFetch<T>(path: string): Promise<T> {
  try {
    return await apiFetch<T>(path, { token: await getToken(), cache: "no-store", headers: await visitorHeaders() });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/api/auth/refresh?next=${encodeURIComponent((await headers()).get("x-pathname") ?? "/")}`);
    }
    throw error;
  }
}
