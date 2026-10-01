import React from 'react';
import { CalendarCheck, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const principles = [
    {
      icon: ShieldCheck,
      title: 'Professional Dental Care',
      description: 'Sterile clinical protocols and transparent oral health recommendations tailored to your comfort.',
    },
    {
      icon: CalendarCheck,
      title: 'Convenient Online Scheduling',
      description: 'Select your preferred date and real-time 30-minute time slot with instant digital confirmation.',
    },
    {
      icon: HeartHandshake,
      title: 'Patient-Focused Approach',
      description: 'Attentive, gentle care for all age groups with thorough explanation before any procedure.',
    },
    {
      icon: Sparkles,
      title: 'Modern Clinic Experience',
      description: 'Equipped operatory suite in Ganagi Complex with strict autoclave sterilization standards.',
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
              Core Principles
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Our Commitment to Every Patient
            </h2>
          </div>
          <p className="text-sm text-slate-500 max-w-md">
            Dedicated oral healthcare delivered with hygiene, transparency, and respect for your time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-5 rounded-xl border border-slate-200/90 bg-neutral-50/60 hover:bg-white hover:border-teal-200 transition-all shadow-2xs group"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-mono font-medium text-slate-400 mb-1">
                  0{idx + 1}.
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
