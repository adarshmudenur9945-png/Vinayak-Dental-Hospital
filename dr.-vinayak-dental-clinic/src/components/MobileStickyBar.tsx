import React from 'react';
import { Phone, MessageCircle, Calendar } from 'lucide-react';
import { ClinicSettings } from '../types';

interface MobileStickyBarProps {
  settings: ClinicSettings | null;
  onOpenBooking: () => void;
}

export const MobileStickyBar: React.FC<MobileStickyBarProps> = ({
  settings,
  onOpenBooking,
}) => {
  const phone = settings?.phone || '+91 82960 74230';
  const cleanPhone = phone.replace(/\s+/g, '');
  const rawWhatsApp = settings?.whatsapp || '918296074230';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    'Hello Dr. Vinayak Dental Clinic, I would like to enquire about booking a dental appointment.'
  )}`;

  return (
    <aside
      aria-label="Quick mobile clinic actions"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 shadow-lg safe-bottom"
    >
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {/* Call Action */}
        <a
          href={`tel:${cleanPhone}`}
          className="flex flex-col items-center justify-center min-h-[46px] rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 transition-colors py-1 focus-visible:outline-teal-600"
          aria-label={`Call clinic at ${phone}`}
        >
          <Phone className="w-4 h-4 text-slate-700" />
          <span className="text-[11px] font-semibold mt-0.5">Call Now</span>
        </a>

        {/* WhatsApp Action */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center min-h-[46px] rounded-lg bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 transition-colors py-1 focus-visible:outline-emerald-600"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-semibold mt-0.5">WhatsApp</span>
        </a>

        {/* Book Appointment Action */}
        <button
          onClick={onOpenBooking}
          className="flex flex-col items-center justify-center min-h-[46px] rounded-lg bg-slate-900 hover:bg-teal-700 active:bg-teal-800 text-white transition-colors py-1 focus-visible:outline-teal-600"
          aria-label="Book a dental appointment"
        >
          <Calendar className="w-4 h-4 text-teal-300" />
          <span className="text-[11px] font-semibold mt-0.5">Book Appt</span>
        </button>
      </div>
    </aside>
  );
};
