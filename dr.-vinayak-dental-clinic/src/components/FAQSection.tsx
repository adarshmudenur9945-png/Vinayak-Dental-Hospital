import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Phone, MessageSquare } from 'lucide-react';
import { FAQItem, ClinicSettings } from '../types';

interface FAQSectionProps {
  faqs: FAQItem[];
  settings: ClinicSettings | null;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ faqs, settings }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const phone = settings?.phone || '+91 82960 74230';
  const rawWhatsApp = settings?.whatsapp || '918296074230';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 lg:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            Common Inquiries
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Clear information about clinic timings, location, appointment booking, and what to expect during your dental visit.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id || idx}
                className="rounded-xl border border-slate-200 bg-neutral-50/50 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-100/50 transition-colors focus-visible:outline-teal-600"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-sm sm:text-base text-slate-900 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-teal-700' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-200/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions prompt */}
        <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Have a specific clinical or scheduling question?
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Our clinic staff in Yargatti is happy to assist you with treatment inquiries or emergency consultations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-teal-700" />
              <span>Call {phone}</span>
            </a>
            <a
              href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                'Hello Dr. Vinayak Dental Clinic, I have a question regarding dental appointments.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
