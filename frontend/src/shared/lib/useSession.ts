"use client";

import { useSyncExternalStore } from "react";
import { USER_COOKIE } from "@/shared/config/auth";

function readName(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${USER_COOKIE}=([^;]*)`));

  return match ? decodeURIComponent(match[1]) : null;
}

// Cookies have no change event: re-read when the tab gets focus (login/logout in another tab).
const subscribe = (onChange: () => void) => {
  window.addEventListener("focus", onChange);
  return () => window.removeEventListener("focus", onChange);
};

/**
 * First name of the signed-in visitor (from the readable cookie set at login), null for guests.
 * The token itself stays in the httpOnly cookie. On the server it is always null (pages stay cacheable).
 */
export function useSessionName(): string | null {
  return useSyncExternalStore(subscribe, readName, () => null);
}
