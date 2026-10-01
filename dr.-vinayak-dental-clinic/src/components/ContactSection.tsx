import React from 'react';
import { MapPin, Phone, MessageSquare, Clock, Navigation, Calendar, Mail, ExternalLink } from 'lucide-react';
import { ClinicSettings, WorkingHour } from '../types';

interface ContactSectionProps {
  settings: ClinicSettings | null;
  workingHours: WorkingHour[];
  onOpenBooking: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  settings,
  workingHours,
  onOpenBooking,
}) => {
  const clinicName = settings?.clinic_name || 'DR. VINAYAK DENTAL CLINIC';
  const addressLine1 = settings?.address_line1 || '1st Floor, Ganagi Complex, Market Road';
  const addressLandmark = settings?.address_landmark || 'Near KSRTC Bus Stand, Above Mahantesh Photo Studio';
  const addressCity = settings?.address_city || 'Yargatti';
  const addressState = settings?.address_state || 'Karnataka';
  const addressPincode = settings?.address_pincode || '591129';
  const phone = settings?.phone || '+91 82960 74230';
  const cleanPhone = phone.replace(/\s+/g, '');
  const rawWhatsApp = settings?.whatsapp || '918296074230';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');
  const email = settings?.email || 'contact@drvinayakdental.com';
  const mapsUrl = settings?.google_maps_url || 'https://maps.google.com/?q=Ganagi+Complex,+Market+Road,+Yargatti,+Karnataka+591129';

  return (
    <section id="contact" className="py-16 lg:py-24 bg-neutral-50/70 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            Clinic Location & Hours
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Visit Dr. Vinayak Dental Clinic
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Conveniently situated in central Yargatti, right near the KSRTC Bus Stand in Ganagi Complex.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Business Details & Operating Hours */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Address & Landmark Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {clinicName}
                  </h3>
                  <p className="text-sm text-slate-700 font-medium mt-1">
                    {addressLine1}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {addressLandmark}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {addressCity}, {addressState} {addressPincode}, India
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-teal-300" />
                  <span>Get Directions</span>
                </a>

                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-700" />
                  <span>Call Clinic</span>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                    'Hello Dr. Vinayak Dental Clinic, I would like to enquire about clinic timings and directions.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Us</span>
                </a>

                <button
                  onClick={onOpenBooking}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-semibold transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-teal-700" />
                  <span>Book Appt</span>
                </button>
              </div>
            </div>

            {/* Operating Hours Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Clinic Consultation Hours
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {workingHours.map((wh) => (
                  <div
                    key={wh.day_of_week}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <span className={`font-medium ${wh.is_open ? 'text-slate-800' : 'text-slate-400'}`}>
                      {wh.day_name}
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${
                        wh.is_open ? 'text-teal-900' : 'text-rose-500'
                      }`}
                    >
                      {wh.is_open ? `${wh.open_time} – ${wh.close_time}` : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] text-slate-500 leading-normal">
                * Advance booking recommended to minimize waiting time. Walk-ins and emergency toothaches accommodated as schedule permits.
              </p>
            </div>

          </div>

          {/* Right Column: Google Maps Destination Card */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              
              {/* Maps Header Bar */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold">Interactive Clinic Location</h4>
                  <p className="text-xs text-teal-200/80">Market Road, Yargatti, Karnataka 591129</p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition-colors"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Embedded Map Visual / Responsive Container */}
              <div className="relative aspect-16/10 sm:aspect-16/9 bg-slate-100 w-full overflow-hidden">
                <iframe
                  title="Dr. Vinayak Dental Clinic Location Map"
                  src="https://maps.google.com/maps?q=Ganagi+Complex,+Market+Road,+Yargatti,+Karnataka+591129&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Directions & Landmark Helper notes */}
              <div className="p-4 bg-neutral-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    <strong>Landmark:</strong> Locate Mahantesh Photo Studio on Market Road; clinic is directly on the 1st Floor of Ganagi Complex.
                  </span>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-teal-800 hover:underline shrink-0"
                >
                  Start GPS Navigation →
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
