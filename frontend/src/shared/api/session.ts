import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/shared/config/auth";
import { apiFetch, ApiError } from "./http";
import type { components } from "./schema";

export type CurrentUser = components["schemas"]["UserResource"];

/**
 * Signed-in user for Server Components (account, checkout). Null for guests and expired tokens.
 * Always fresh — never cached between users.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  if (!token) return null;

  try {
    const response = await apiFetch<{ data: CurrentUser }>("/auth/me", { token, cache: "no-store" });

    return response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}
