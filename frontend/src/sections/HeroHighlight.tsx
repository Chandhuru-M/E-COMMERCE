import { heroHighlight } from '../data/products';
import { formatPrice } from '../lib/currency';
import { useCartStore } from '../store/cartStore';
import type { CartState } from '../store/cartStore';

export const HeroHighlight = () => {
  const upsertItem = useCartStore((state: CartState) => state.upsertItem);

  return (
    <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-10 py-16 text-white shadow-2xl">
      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]">
            {heroHighlight.tag}
          </span>
          <h1 className="text-4xl font-semibold leading-snug">{heroHighlight.name}</h1>
          <p className="text-lg text-slate-200">{heroHighlight.description}</p>
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-3xl font-bold">{formatPrice(heroHighlight.price, heroHighlight.currency)}</span>
            <button
              onClick={() =>
                upsertItem({
                  id: heroHighlight.id,
                  name: heroHighlight.name,
                  price: heroHighlight.price,
                  image: heroHighlight.image,
                  quantity: 1,
                  currency: heroHighlight.currency ?? 'INR',
                  sku: heroHighlight.sku
                })
              }
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-white/40"
            >
              Preorder Now
            </button>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-5 text-sm text-slate-200/80">
            <div>
              <p className="font-semibold text-white">AI Command Center</p>
              <p>Generative workflows and 12ms predictive touch.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Planet Positive</p>
              <p>Crafted with recycled alloys and zero plastic packaging.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Priority Delivery</p>
              <p>Next-day fulfillment and concierge setup.</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <img
            src={heroHighlight.image}
            alt={heroHighlight.name}
            className="relative z-10 h-full w-full rounded-3xl object-cover shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
};
