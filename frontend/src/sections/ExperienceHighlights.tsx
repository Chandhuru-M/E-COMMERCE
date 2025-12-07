import { Sparkles, ShieldCheck, Truck } from 'lucide-react';

const highlights = [
  {
    icon: Sparkles,
    title: 'Immersive discovery',
    description: '3D product views, live concierge demos, community reviews—all in one immersive feed.'
  },
  {
    icon: ShieldCheck,
    title: 'Trust by design',
    description: 'Supabase Row Level Security keeps your data safe; payments encrypted with Stripe Radar.'
  },
  {
    icon: Truck,
    title: 'Lightning fulfillment',
    description: '15-minute slot scheduling in metros, climate-positive packaging, transparent live tracking.'
  }
];

export const ExperienceHighlights = () => {
  return (
    <section className="grid gap-6 rounded-[2.5rem] bg-white p-10 shadow-xl md:grid-cols-3">
      {highlights.map((highlight) => {
        const Icon = highlight.icon;
        return (
          <article key={highlight.title} className="space-y-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow">
              <Icon size={24} />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">{highlight.title}</h3>
            <p className="text-sm text-slate-500">{highlight.description}</p>
          </article>
        );
      })}
    </section>
  );
};
