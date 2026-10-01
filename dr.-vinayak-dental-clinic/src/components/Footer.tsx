import React from 'react';
import { Phone, MapPin, MessageSquare, ShieldCheck, Lock } from 'lucide-react';
import { ClinicSettings } from '../types';

interface FooterProps {
  settings: ClinicSettings | null;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenAdmin: () => void;
  onOpenBooking: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenPrivacy,
  onOpenTerms,
  onOpenAdmin,
  onOpenBooking,
}) => {
  const clinicName = settings?.clinic_name || 'DR. VINAYAK DENTAL CLINIC';
  const phone = settings?.phone || '+91 82960 74230';
  const cleanPhone = phone.replace(/\s+/g, '');
  const rawWhatsApp = settings?.whatsapp || '918296074230';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');
  const addressLine1 = settings?.address_line1 || '1st Floor, Ganagi Complex, Market Road';
  const addressLandmark = settings?.address_landmark || 'Near KSRTC Bus Stand, Above Mahantesh Photo Studio';
  const addressCity = settings?.address_city || 'Yargatti';
  const addressState = settings?.address_state || 'Karnataka';
  const addressPincode = settings?.address_pincode || '591129';

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-20 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Clinic Brand Wordmark & Summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C7.5 2 5 5 5 9.5C5 14 7.5 18 9.5 22C10 23 11 23 11.5 21.5L12 19L12.5 21.5C13 23 14 23 14.5 22C16.5 18 19 14 19 9.5C19 5 16.5 2 12 2ZM12 7C12.8 7 13.5 7.7 13.5 8.5C13.5 9.3 12.8 10 12 10C11.2 10 10.5 9.3 10.5 8.5C10.5 7.7 11.2 7 12 7Z" />
                </svg>
              </div>
              <span className="font-display font-bold text-white text-lg tracking-tight">
                {clinicName}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Professional dental healthcare practice in Yargatti, Karnataka. Dedicated to providing patient-centered dental consultations, hygiene cleanings, restorations, and emergency oral care.
            </p>

            <div className="pt-2">
              <button
                onClick={onOpenBooking}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-2xs"
              >
                Book Dental Appointment
              </button>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Dental Services</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Practice</a></li>
              <li><a href="#gallery" className="hover:text-white transition-colors">Clinic Gallery</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Patient FAQs</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Location & Directions</a></li>
            </ul>
          </div>

          {/* Col 3: Verified Contact Coordinates */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Contact & Location
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  {addressLine1}, {addressLandmark}, {addressCity}, {addressState} {addressPincode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <a href={`tel:${cleanPhone}`} className="hover:text-white transition-colors font-medium">
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${cleanWhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: +91 82960 74230
                </a>
              </div>
            </div>
          </div>

          {/* Col 4: Timings & Staff Portal */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Operating Hours
            </h4>
            <div className="text-xs space-y-1.5 text-slate-400">
              <p className="flex justify-between">
                <span>Monday – Saturday:</span>
                <span className="font-semibold text-slate-200">9:00 AM – 8:00 PM</span>
              </p>
              <p className="flex justify-between">
                <span>Sunday:</span>
                <span className="text-rose-400 font-semibold">Closed</span>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-300 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Clinic Management Login</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {clinicName}. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <button
              onClick={onOpenTerms}
              className="hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
