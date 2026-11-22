"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import type { Locale } from "@/shared/i18n/config";
import { I18nProvider } from "@/shared/i18n/client";
import type { BrowserDictionary } from "@/shared/i18n/browserDictionary";

/**
 * Client-side providers: language, TanStack Query (cart, favorites), toasts.
 */
export function Providers({ locale, dictionary, children }: { locale: Locale; dictionary: BrowserDictionary; children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } } }),
  );
  useKeyboardFocusMark();

  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !border-border !bg-surface !text-foreground !shadow-xl !shadow-black/10",
              description: "!text-muted-foreground",
              actionButton: "!rounded-lg !bg-primary !text-primary-foreground !font-semibold",
            },
          }}
        />
      </QueryClientProvider>
    </I18nProvider>
  );
}

/**
 * Marks <html data-keyboard> while the visitor moves with the keyboard and drops it on a click or touch.
 * The focus outline of buttons and links shows only with the mark (globals.css): a click leaves no frame,
 * moving with Tab still shows where you are.
 */
function useKeyboardFocusMark() {
  useEffect(() => {
    const root = document.documentElement;
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key?.startsWith("Arrow")) root.dataset.keyboard = "";
    };
    const pointer = () => {
      delete root.dataset.keyboard;
    };
    window.addEventListener("keydown", keyboard, true);
    window.addEventListener("pointerdown", pointer, true);
    return () => {
      window.removeEventListener("keydown", keyboard, true);
      window.removeEventListener("pointerdown", pointer, true);
    };
  }, []);
}
