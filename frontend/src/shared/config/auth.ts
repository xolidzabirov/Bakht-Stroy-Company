/**
 * Session cookies.
 * The API token lives only in an httpOnly cookie — browser JavaScript never sees it.
 * A second, readable cookie keeps the first name so the header can greet the user on cached pages.
 */
export const AUTH_COOKIE = "bakht_token";
export const USER_COOKIE = "bakht_user";
/** httpOnly as well: renews the token without a new login (shared/api/bff.ts). */
export const REFRESH_COOKIE = "bakht_refresh";

/** The token is replaced this long before it ends, so a page never meets an ended one. */
export const RENEW_BEFORE_SECONDS = 120;

/** Pages that need a signed-in user; guests are sent to /login?next=… */
export const PROTECTED_PATHS = ["/account", "/cart", "/favorites", "/checkout", "/admin"];

/** Pages a signed-in user does not need. */
export const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

/**
 * Safe "next" redirect: only paths of this site ("/cart"), never "//evil.com" or "https://…".
 */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
