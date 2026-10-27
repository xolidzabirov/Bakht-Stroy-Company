import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { ApiError } from "./http";

/**
 * Browser → Next.js BFF (/api/auth/*, /api/proxy/*). Same error format as the Laravel API.
 */
export async function bff<T>(path: string, { method = "POST", body }: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  // FormData (file uploads) sets its own multipart type with the boundary.
  const isForm = body instanceof FormData;

  try {
    response = await fetch(path, {
      method,
      headers: { Accept: "application/json", ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}) },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Нет соединения с интернетом. Проверьте сеть и попробуйте ещё раз.", 0, "NETWORK_ERROR");
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "Что-то пошло не так. Попробуйте ещё раз.", response.status, payload?.code ?? "HTTP_ERROR", payload?.errors, payload?.details);
  }

  return payload as T;
}

/**
 * Puts the API validation errors under the form fields; returns the message for the top of the form
 * when the error is not about a field (wrong password, too many attempts, server down).
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  messages: Dictionary["errors"],
): string | null {
  if (!(error instanceof ApiError)) return messages.generic;

  if (error.code === "NETWORK_ERROR") return messages.network;

  if (error.status === 422 && error.errors) {
    let placed = false;

    for (const [field, messages] of Object.entries(error.errors)) {
      if ((fields as readonly string[]).includes(field)) {
        setError(field as Path<T>, { type: "server", message: messages[0] });
        placed = true;
      }
    }

    if (placed) return null;
  }

  if (error.status === 429) {
    return error.message || messages.tooMany;
  }

  return error.message || messages.generic;
}
