"use client";

import { useSyncExternalStore } from "react";

export type ChatProductDraft = { id: number; name: string; image: string | null };
type PanelState = { open: boolean; product: ChatProductDraft | null };

const closed: PanelState = { open: false, product: null };
let state: PanelState = closed;
const listeners = new Set<() => void>();

const set = (next: PanelState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

/**
 * The floating chat window, opened from anywhere: the header, a product page ("ask about this product")
 * or an order. A product passed here is attached to the next message as a card.
 */
export const chatPanel = {
  open: (product: ChatProductDraft | null = null) => set({ open: true, product: product ?? state.product }),
  close: () => set({ ...state, open: false }),
  toggle: () => set({ ...state, open: !state.open }),
  clearProduct: () => set({ ...state, product: null }),
};

export function useChatPanel(): PanelState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => closed,
  );
}
