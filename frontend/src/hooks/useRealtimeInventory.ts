import { useEffect } from 'react';

import { supabase } from '../lib/supabaseClient';
import { useCartStore } from '../store/cartStore';
import type { CartItem, CartState } from '../store/cartStore';

interface InventoryPayload {
  variant_id: string;
  stock: number;
}

export const useRealtimeInventory = () => {
  const removeItem = useCartStore((state: CartState) => state.removeItem);
  const items = useCartStore((state: CartState) => state.items);

  useEffect(() => {
    const channel = supabase
      .channel('inventory-sync')
      .on('broadcast', { event: 'inventory_update' }, (payload) => {
        const data = payload.payload as InventoryPayload;
        const cartItem = items.find((item: CartItem) => item.id === data.variant_id);
        if (cartItem && data.stock === 0) {
          removeItem(cartItem.id);
        }
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [items, removeItem]);
};
