"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bff } from "@/shared/api/client";
import type { Cart } from "@/shared/api/types";

export const cartKey = ["cart"] as const;

type CartResponse = { data: Cart };

const emptyCart: Cart = { items: [], items_count: 0, subtotal: 0, has_problems: false, can_checkout: false };

/**
 * Cart of the signed-in user (through the BFF proxy). Disabled for guests — they have no cart.
 */
export function useCart({ enabled = true, initialData }: { enabled?: boolean; initialData?: Cart } = {}) {
  return useQuery({
    queryKey: cartKey,
    queryFn: async () => (await bff<CartResponse>("/api/proxy/cart", { method: "GET" })).data,
    enabled,
    initialData,
    placeholderData: enabled ? undefined : emptyCart,
  });
}

/** Every cart change returns the whole new cart — put it straight into the cache. */
function useCartMutation<T>(request: (input: T) => Promise<CartResponse | undefined>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: (response) => {
      if (response?.data) queryClient.setQueryData(cartKey, response.data);
      else queryClient.invalidateQueries({ queryKey: cartKey });
    },
  });
}

export function useAddToCart() {
  return useCartMutation(({ productId, quantity }: { productId: number; quantity: number }) =>
    bff<CartResponse>("/api/proxy/cart/items", { body: { product_id: productId, quantity } }),
  );
}

export function useSetCartQuantity() {
  return useCartMutation(({ itemId, quantity }: { itemId: number; quantity: number }) =>
    bff<CartResponse>(`/api/proxy/cart/items/${itemId}`, { method: "PATCH", body: { quantity } }),
  );
}

export function useRemoveFromCart() {
  return useCartMutation((itemId: number) => bff<CartResponse>(`/api/proxy/cart/items/${itemId}`, { method: "DELETE" }));
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => bff("/api/proxy/cart", { method: "DELETE" }),
    onSuccess: () => queryClient.setQueryData(cartKey, emptyCart),
  });
}
