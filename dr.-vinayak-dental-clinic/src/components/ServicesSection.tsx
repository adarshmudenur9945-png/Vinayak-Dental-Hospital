import React, { useState } from 'react';
import { Calendar, Info, Clock, Stethoscope } from 'lucide-react';
import { Service } from '../types';

interface ServicesSectionProps {
  services: Service[];
  onOpenBooking: (serviceId?: string) => void;
  onSelectServiceDetail: (service: Service) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onOpenBooking,
  onSelectServiceDetail,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  return (
    <section id="services" className="py-16 lg:py-24 bg-neutral-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            Clinical Services
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Comprehensive Dental Care
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            From routine checkups and ultrasonic cleanings to restorative procedures and pain management in Yargatti.
          </p>
        </div>

        {/* Category Filter Controls (Functional Segmented Buttons per Rule 1.A) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-teal-600 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat === 'all' ? 'All Treatments' : cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-slate-200/90 hover:border-teal-300 transition-all p-5 shadow-2xs hover:shadow-xs flex flex-col justify-between group"
            >
              <div>
                {/* Clean unboxed category & duration line */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                  <span className="font-medium text-teal-800">{service.category}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="tabular-nums">{service.duration_minutes}m</span>
                  </div>
                </div>

                {/* Service Title */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-900 transition-colors leading-snug mb-2">
                  {service.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {service.description}
                </p>

                {/* Status indicator if provisional */}
                {service.is_configured === 0 && (
                  <div className="text-[11px] text-amber-700 bg-amber-50/80 px-2 py-1 rounded border border-amber-200/60 mb-3">
                    Provisional listing · Confirm at consultation
                  </div>
                )}
              </div>

              {/* Card Footer: Price & Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                <div className="text-xs font-semibold text-slate-700 truncate max-w-[140px]" title={service.price_display}>
                  {service.price_display}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectServiceDetail(service)}
                    aria-label={`View details for ${service.name}`}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="View treatment details & preparation"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenBooking(service.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 active:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-teal-300" />
                    <span>Book Service</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Notice on unverified prices / customizations */}
        <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Clinical diagnoses and personalized treatment plans are established in person during your clinical evaluation.
            </span>
          </div>
          <button
            onClick={() => onOpenBooking('srv-consultation')}
            className="text-teal-700 font-semibold hover:underline whitespace-nowrap"
          >
            Book General Consultation →
          </button>
        </div>

      </div>
    </section>
  );
};
