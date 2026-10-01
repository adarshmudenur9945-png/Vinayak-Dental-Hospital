import React from 'react';
import { X, Calendar, Phone, Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Service, ClinicSettings } from '../types';

interface ServiceDetailModalProps {
  service: Service | null;
  settings: ClinicSettings | null;
  onClose: () => void;
  onBookService: (serviceId: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  settings,
  onClose,
  onBookService,
}) => {
  if (!service) return null;

  const phone = settings?.phone || '+91 82960 74230';
  const cleanPhone = phone.replace(/\s+/g, '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
        
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              {service.category}
            </span>
            <h2 id="service-modal-title" className="text-xl font-bold text-slate-900 leading-tight">
              {service.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close service details"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Unconfigured / Provisional Notice */}
          {service.is_configured === 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Provisional Catalog Listing: </span>
                Specific treatment parameters, procedures, and fees are finalized during in-person clinical assessment by Dr. Vinayak.
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <div>
                <span className="text-xs text-slate-500 block">Typical Duration</span>
                <span className="font-semibold text-slate-900">{service.duration_minutes} Minutes</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Pricing</span>
              <span className="font-semibold text-slate-900">{service.price_display}</span>
            </div>
          </div>

          {/* Overview */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Service Overview
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm">
              {service.description}
            </p>
          </div>

          {/* What Treatment Involves */}
          {service.details_treatment && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                What the Treatment Involves
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm bg-neutral-50 p-3.5 rounded-lg border border-neutral-200/60">
                {service.details_treatment}
              </p>
            </div>
          )}

          {/* Who It Is Suitable For */}
          {service.details_suitability && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Who It May Be Suitable For
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm">
                {service.details_suitability}
              </p>
            </div>
          )}

          {/* Preparation & Aftercare */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {service.details_prep && (
              <div className="p-3.5 rounded-lg bg-teal-50/50 border border-teal-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-900 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                  <span>Preparation</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.details_prep}
                </p>
              </div>
            )}

            {service.details_aftercare && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                  <span>Aftercare Guidance</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.details_aftercare}
                </p>
              </div>
            )}
          </div>

          {/* Educational Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-neutral-100 rounded-lg text-[11px] text-slate-500 border border-neutral-200">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong>Medical Information Note:</strong> This information is for general education and does not replace professional dental advice, clinical examination, or diagnosis by a qualified practitioner.
            </div>
          </div>

        </div>

        {/* Footer CTAs */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span>Call Clinic ({phone})</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookService(service.id);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-300" />
              <span>Book This Service</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
