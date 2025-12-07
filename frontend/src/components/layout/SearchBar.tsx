import type { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const SearchBar = ({ className, ...props }: SearchBarProps) => {
  return (
    <div className={clsx('group relative flex items-center', className)}>
      <Search className="absolute left-4 z-10 h-5 w-5 text-slate-400 transition group-focus-within:text-brand-500" />
      <input
        {...props}
        type="search"
        placeholder="Search for products, brands and more"
        className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
};
