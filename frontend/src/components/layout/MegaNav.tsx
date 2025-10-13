import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { CartButton } from '../cart/CartButton';

const categories = [
  {
    label: 'Electronics',
    links: ['Smartphones', 'Laptops', 'Audio', 'Wearables', 'Gaming']
  },
  {
    label: 'Fashion',
    links: ['Men', 'Women', 'Kids', 'Footwear', 'Accessories']
  },
  {
    label: 'Home & Living',
    links: ['Furniture', 'Decor', 'Kitchen', 'Smart Home']
  },
  {
    label: 'Beauty',
    links: ['Makeup', 'Fragrance', 'Wellness', 'Grooming']
  }
];

export const MegaNav = () => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
            NeoCommerce
          </span>
          <span className="text-xl font-semibold text-slate-900">Marketplace</span>
        </div>
        <SearchBar className="flex-1" />
        <CartButton />
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 text-sm font-medium text-slate-700">
          {categories.map((category) => (
            <div
              key={category.label}
              className="relative"
              onMouseEnter={() => setOpenCategory(category.label)}
              onMouseLeave={() => setOpenCategory(null)}
            >
              <button className="flex items-center gap-1 rounded-full px-4 py-2 transition hover:bg-white hover:shadow-card">
                <span>{category.label}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {openCategory === category.label && (
                <div className="absolute left-0 top-full z-20 mt-3 grid w-[380px] gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                  {category.links.map((link) => (
                    <Link key={link} to={`/category/${link.toLowerCase()}`} className="text-slate-600 hover:text-brand-500">
                      {link}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link to="/deals" className="rounded-full px-4 py-2 text-brand-600 transition hover:bg-brand-50">
            Today&apos;s Deals
          </Link>
          <Link to="/business" className="rounded-full px-4 py-2 transition hover:bg-white hover:shadow-card">
            Neo for Business
          </Link>
        </div>
      </div>
    </nav>
  );
};
