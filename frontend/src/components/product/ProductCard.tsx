import { Star, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

import { formatPrice } from '../../lib/currency';
import { useCartStore } from '../../store/cartStore';
import type { CartState } from '../../store/cartStore';
import type { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const upsertItem = useCartStore((state: CartState) => state.upsertItem);

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative overflow-hidden rounded-t-3xl">
        <img
          src={product.image}
          alt={product.name}
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
        />
        {product.tag && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-600 shadow">
            {product.tag}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{product.description}</p>
          </div>
          {product.rating && (
            <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <Star size={14} className="fill-amber-500 text-amber-500" />
              <span>
                {product.rating}
                <span className="ml-1 text-slate-400">({product.reviews})</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-semibold text-slate-900">{formatPrice(product.price, product.currency)}</p>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <TrendingUp size={14} /> Hot pick this week
          </span>
        </div>
        <button
          onClick={() =>
            upsertItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              quantity: 1,
              currency: product.currency ?? 'INR',
              sku: product.sku
            })
          }
          className={clsx(
            'mt-auto rounded-full px-4 py-3 text-sm font-semibold transition',
            'bg-slate-900 text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200'
          )}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
};
