/**
 * Session cookies.
 * The API token lives only in an httpOnly cookie — browser JavaScript never sees it.
 * A second, readable cookie keeps the first name so the header can greet the user on cached pages.
 */
export const AUTH_COOKIE = "bakht_token";
export const USER_COOKIE = "bakht_user";

/** Token lifetime on the backend (Sanctum): 24 hours, then the person signs in again. */
export const SESSION_MAX_AGE = 60 * 60 * 24;

/** Pages that need a signed-in user; guests are sent to /login?next=… */
export const PROTECTED_PATHS = ["/account", "/cart", "/favorites", "/checkout"];

/** Pages a signed-in user does not need. */
export const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

/**
 * Safe "next" redirect: only paths of this site ("/cart"), never "//evil.com" or "https://…".
 */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
