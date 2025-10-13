import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

import { CartDrawer } from './CartDrawer';
import { useCartStore } from '../../store/cartStore';
import type { CartItem, CartState } from '../../store/cartStore';

export const CartButton = () => {
  const itemCount = useCartStore((state: CartState) =>
    state.items.reduce((total: number, item: CartItem) => total + item.quantity, 0)
  );
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
      >
        <ShoppingBag size={18} />
        <span>Cart</span>
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 grid h-6 w-6 place-content-center rounded-full bg-white text-xs font-bold text-brand-600 shadow">
            {itemCount}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
};
