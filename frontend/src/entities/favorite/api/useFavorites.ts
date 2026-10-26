"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bff } from "@/shared/api/client";
import type { Paginated, Product } from "@/shared/api/types";

export const favoritesKey = ["favorites", "ids"] as const;

/**
 * Ids of the user's favorite products — to paint the hearts on cached catalog pages.
 */
export function useFavoriteIds(enabled: boolean) {
  return useQuery({
    queryKey: favoritesKey,
    queryFn: async () => {
      const response = await bff<Paginated<Product>>("/api/proxy/favorites?per_page=60", { method: "GET" });

      return response.data.map((product) => product.id);
    },
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Add / remove with an optimistic heart: it changes at once and rolls back if the request fails.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, favorite }: { productId: number; favorite: boolean }) =>
      bff(`/api/proxy/favorites/${productId}`, { method: favorite ? "POST" : "DELETE" }),
    onMutate: async ({ productId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey });
      const previous = queryClient.getQueryData<number[]>(favoritesKey);

      queryClient.setQueryData<number[]>(favoritesKey, (ids = []) => (favorite ? [...new Set([...ids, productId])] : ids.filter((id) => id !== productId)));

      return { previous };
    },
    onError: (_error, _input, context) => queryClient.setQueryData(favoritesKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoritesKey }),
  });
}
