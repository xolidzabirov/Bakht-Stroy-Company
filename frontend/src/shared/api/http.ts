import { env } from "@/shared/config/env";

/**
 * API error in the backend format: { message, code, errors?, details? }.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly errors?: Record<string, string[]>,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  /** Bearer token of the user (server side only). */
  token?: string;
  /** JSON body. */
  body?: unknown;
  /** Seconds to cache a GET response on the server (Next.js data cache). */
  revalidate?: number;
};

/**
 * Typed request to the Laravel API. Throws ApiError on 4xx/5xx.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, body, revalidate, headers, ...init } = options;

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(revalidate !== undefined ? { next: { revalidate } } : {}),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? "Не удалось выполнить запрос.",
      response.status,
      payload?.code ?? "HTTP_ERROR",
      payload?.errors,
      payload?.details,
    );
  }

  return payload as T;
}

/**
 * Same as apiFetch, but returns null when the API is unreachable or answers with an error —
 * public pages keep working (with placeholders) even if the backend is down.
 */
export async function apiTry<T>(path: string, options: ApiFetchOptions = {}): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch {
    return null;
  }
}
