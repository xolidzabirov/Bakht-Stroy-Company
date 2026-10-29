"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

/**
 * Gives Client Components the language and the texts chosen on the server (root layout).
 * Only the current language travels to the browser — the other dictionaries stay on the server.
 */
export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: dictionary }}>{children}</I18nContext.Provider>;
}

export function useI18n(): { locale: Locale; t: Dictionary } {
  const value = useContext(I18nContext);

  if (!value) throw new Error("useI18n() must be used inside <I18nProvider>.");

  return value;
}
