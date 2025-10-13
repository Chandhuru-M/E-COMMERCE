import { ProductCard } from '../components/product/ProductCard';
import { useProducts } from '../hooks/useProducts';
import clsx from 'clsx';

const SkeletonCard = () => (
  <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="skeleton h-56 w-full rounded-2xl" />
    <div className="mt-6 space-y-3">
      <div className="skeleton h-4 w-3/5" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
    </div>
    <div className="mt-auto flex items-center justify-between pt-6">
      <div className="skeleton h-6 w-24" />
      <div className="skeleton h-10 w-28 rounded-full" />
    </div>
  </div>
);

export const ProductGallery = () => {
  const { data, loading, error } = useProducts({ limit: 6 });
  const products = data;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-500">Curated for you</p>
          <h2 className="text-2xl font-semibold text-slate-900">Trending drops from design-led brands</h2>
        </div>
        <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
          View all collections
        </button>
      </div>
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          Unable to load live catalog right now. Showing editorial picks instead.
        </div>
      )}
  <div className={clsx('grid gap-6 sm:grid-cols-2 xl:grid-cols-3')}>
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
};
