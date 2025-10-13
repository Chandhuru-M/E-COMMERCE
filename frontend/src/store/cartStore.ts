import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { StateCreator } from 'zustand';
import type { Product } from '../types/product';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  currency: Product['currency'];
  variant?: string;
  sku?: Product['sku'];
}

export interface CartState {
  items: CartItem[];
  upsertItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

const creator: StateCreator<CartState> = (set) => ({
  items: [],
  upsertItem: (item: CartItem) =>
    set((state: CartState) => {
      const existing = state.items.find((entry: CartItem) => entry.id === item.id);
      if (existing) {
        return {
          items: state.items.map((entry: CartItem) =>
            entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry
          )
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (id: string) =>
    set((state: CartState) => ({ items: state.items.filter((entry: CartItem) => entry.id !== id) })),
  clear: () => set({ items: [] })
});

export const useCartStore = create<CartState>()(
  persist(creator, {
    name: 'neocommerce-cart'
  })
);
