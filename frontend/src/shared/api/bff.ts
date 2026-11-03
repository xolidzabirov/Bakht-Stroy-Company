import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, REFRESH_COOKIE, RENEW_BEFORE_SECONDS, USER_COOKIE } from "@/shared/config/auth";
import { env } from "@/shared/config/env";

/**
 * Server side of the BFF: Route Handlers call Laravel on behalf of the browser.
 * Adds the token (from the httpOnly cookie, or `token` when it has just been renewed),
 * the client IP (rate limits) and the device name (sessions list).
 */
export async function callBackend(
  request: NextRequest,
  path: string,
  init: { method?: string; body?: string | ArrayBuffer | null; contentType?: string | null; token?: string; signal?: AbortSignal } = {},
): Promise<Response> {
  const token = init.token ?? request.cookies.get(AUTH_COOKIE)?.value;
  const forwardedFor = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  // JSON by default; uploads (multipart/form-data with its boundary) keep the browser's own type.
  const contentType = init.body ? (init.contentType ?? "application/json") : null;

  return fetch(`${env.apiUrl}${path}`, {
    method: init.method ?? request.method,
    headers: {
      Accept: "application/json",
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      "Accept-Language": request.headers.get("accept-language") ?? "ru",
      "User-Agent": request.headers.get("user-agent") ?? "Bakht Stroy web",
    },
    body: init.body ?? undefined,
    cache: "no-store",
    signal: init.signal,
  });
}

/** "Chrome Windows", "Safari iPhone" — shown in the account's sessions list. */
export function deviceName(request: NextRequest): string {
  const ua = request.headers.get("user-agent") ?? "";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /YaBrowser/.test(ua) ? "Яндекс Браузер" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Браузер";
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";

  return `${browser} ${os}`.trim();
}

type AuthData = {
  user: { name: string };
  token: string;
  expires_at?: string | null;
  refresh_token?: string;
  refresh_expires_at?: string | null;
};
type AuthPayload = { data: AuthData };

const secondsUntil = (date: string | null | undefined) => (date ? Math.max(0, Math.floor((new Date(date).getTime() - Date.now()) / 1000)) : undefined);

/**
 * Everything a renewal needs fits in one httpOnly cookie: "<remember 1|0>.<when the token ends, unix seconds>.<refresh token>".
 * Without the date the server could not know when to renew a "don't remember me" session, whose cookies have no end.
 */
function readRefreshCookie(request: NextRequest): { remember: boolean; tokenEndsAt: number; refreshToken: string } | null {
  const [remember, tokenEndsAt, ...rest] = (request.cookies.get(REFRESH_COOKIE)?.value ?? "").split(".");
  const refreshToken = rest.join(".");

  return refreshToken ? { remember: remember === "1", tokenEndsAt: Number(tokenEndsAt) || 0, refreshToken } : null;
}

/** Puts a session into cookies. "remember = false" makes session cookies (gone when the browser closes). */
function setSessionCookies(response: NextResponse, data: AuthData, remember: boolean): NextResponse {
  const secure = process.env.NODE_ENV === "production";
  const refreshMaxAge = remember ? secondsUntil(data.refresh_expires_at) : undefined;

  response.cookies.set(AUTH_COOKIE, data.token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: remember ? secondsUntil(data.expires_at) : undefined });
  response.cookies.set(USER_COOKIE, data.user.name.split(" ")[0], { secure, sameSite: "lax", path: "/", maxAge: refreshMaxAge });

  if (data.refresh_token) {
    const tokenEndsAt = data.expires_at ? Math.floor(new Date(data.expires_at).getTime() / 1000) : 0;

    response.cookies.set(REFRESH_COOKIE, `${remember ? 1 : 0}.${tokenEndsAt}.${data.refresh_token}`, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: refreshMaxAge });
  }

  return response;
}

/**
 * Turns the API answer with a token into a browser response: the tokens go to httpOnly cookies,
 * the body keeps only the user.
 */
export function withSession(payload: AuthPayload, remember = true, status = 200): NextResponse {
  return setSessionCookies(NextResponse.json({ data: { user: payload.data.user } }, { status }), payload.data, remember);
}

export function clearSession(response: NextResponse): NextResponse {
  response.cookies.delete(AUTH_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(USER_COOKIE);

  return response;
}

/**
 * renewed — new tokens; rejected — the session has ended (logout, block, long absence);
 * unavailable — the API did not answer, nothing is known: the session must not be thrown away for that.
 */
export type Renewal = { status: "renewed"; data: AuthData; remember: boolean } | { status: "rejected" } | { status: "unavailable" };

/** There is a refresh token, and the token is gone or about to end. */
export function isRenewalDue(request: NextRequest): boolean {
  const refresh = readRefreshCookie(request);

  return refresh !== null && (!request.cookies.has(AUTH_COOKIE) || refresh.tokenEndsAt - Date.now() / 1000 < RENEW_BEFORE_SECONDS);
}

export function canRenew(request: NextRequest): boolean {
  return readRefreshCookie(request) !== null;
}

/** Renewals under way: a burst of requests (a page prefetching its links) shares one call to the API. */
const renewalsUnderWay = new Map<string, Promise<Renewal>>();

/** Asks the API for new tokens. The cookies change only on the response: see applyRenewal. */
export function renewSession(request: NextRequest, timeoutMs = 25_000): Promise<Renewal> {
  const refresh = readRefreshCookie(request);

  if (!refresh) return Promise.resolve({ status: "rejected" });

  const underWay = renewalsUnderWay.get(refresh.refreshToken);

  if (underWay) return underWay;

  const renewal = askForNewTokens(request, refresh, timeoutMs).finally(() => renewalsUnderWay.delete(refresh.refreshToken));

  renewalsUnderWay.set(refresh.refreshToken, renewal);

  return renewal;
}

async function askForNewTokens(request: NextRequest, refresh: { remember: boolean; refreshToken: string }, timeoutMs: number): Promise<Renewal> {
  try {
    const upstream = await callBackend(request, "/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refresh.refreshToken }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (upstream.ok) return { status: "renewed", data: ((await upstream.json()) as AuthPayload).data, remember: refresh.remember };

    return upstream.status === 401 ? { status: "rejected" } : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

/** New cookies after a renewal, none after a session that has ended; an unanswered renewal changes nothing. */
export function applyRenewal<T extends NextResponse>(response: T, renewal: Renewal | null): T {
  if (renewal?.status === "renewed") setSessionCookies(response, renewal.data, renewal.remember);
  if (renewal?.status === "rejected") clearSession(response);

  return response;
}

/** Passes the Laravel answer to the browser as is (status, JSON error format). */
export async function relay(upstream: Response): Promise<NextResponse> {
  if (upstream.status === 204) return new NextResponse(null, { status: 204 });

  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

/** When the API is down — the same error format as Laravel. */
export function unavailable(): NextResponse {
  return NextResponse.json({ message: "Сервер временно недоступен. Попробуйте через минуту.", code: "SERVICE_UNAVAILABLE" }, { status: 503 });
}
