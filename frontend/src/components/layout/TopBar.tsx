import { Link } from 'react-router-dom';

export const TopBar = () => {
  return (
    <header className="bg-slate-900 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 text-sm">
        <Link to="/" className="font-semibold">
          NeoCommerce
        </Link>
        <nav className="flex gap-4">
          <Link to="/help" className="hover:text-brand-200">
            Help Center
          </Link>
          <Link to="/track" className="hover:text-brand-200">
            Track Order
          </Link>
          <Link to="/account" className="hover:text-brand-200">
            Account
          </Link>
        </nav>
      </div>
    </header>
  );
};
