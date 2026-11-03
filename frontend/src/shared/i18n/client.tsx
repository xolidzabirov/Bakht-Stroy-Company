"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { BrowserDictionary } from "./browserDictionary";
import type { Dictionary } from "./dictionaries";

const I18nContext = createContext<{ locale: Locale; t: BrowserDictionary } | null>(null);

/**
 * Gives Client Components the language and the texts chosen on the server (root layout).
 * Only the current language travels to the browser — the other dictionaries stay on the server.
 */
export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: BrowserDictionary; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: dictionary }}>{children}</I18nContext.Provider>;
}

export function useI18n(): { locale: Locale; t: BrowserDictionary } {
  const value = useContext(I18nContext);

  if (!value) throw new Error("useI18n() must be used inside <I18nProvider>.");

  return value;
}

/** Inside the admin panel only: its layout provides the whole dictionary (the shop's pages do not carry the admin texts). */
export function useAdminI18n(): { locale: Locale; t: Dictionary } {
  return useI18n() as { locale: Locale; t: Dictionary };
}
