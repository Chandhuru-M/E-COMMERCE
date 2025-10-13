export const Footer = () => {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 text-sm text-slate-500 md:grid-cols-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">NeoCommerce</h3>
          <p className="mt-3 text-sm">
            Shop premium products curated for modern living. Experience ultra-fast delivery, curated collections, and
            concierge support.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Company</p>
          <ul className="mt-3 space-y-2">
            <li>About Us</li>
            <li>Careers</li>
            <li>Press</li>
            <li>Affiliate</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Support</p>
          <ul className="mt-3 space-y-2">
            <li>Shipping & Returns</li>
            <li>Payments</li>
            <li>Warranty</li>
            <li>FAQs</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Newsletter</p>
          <p className="mt-3 text-sm">Be the first to know about product drops and exclusive offers.</p>
          <form className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
            <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} NeoCommerce. Crafted with care for real-time commerce experiences.
      </div>
    </footer>
  );
};
