"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import type { Locale } from "@/shared/i18n/config";
import { I18nProvider } from "@/shared/i18n/client";
import type { Dictionary } from "@/shared/i18n/dictionaries";

/**
 * Client-side providers: language, TanStack Query (cart, favorites), toasts.
 */
export function Providers({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } } }),
  );

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
