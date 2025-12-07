import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { MegaNav } from './MegaNav';
import { Footer } from './Footer';
import { useRealtimeInventory } from '../../hooks/useRealtimeInventory';

export const AppLayout = () => {
  useRealtimeInventory();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />
      <MegaNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
