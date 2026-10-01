import React from 'react';
import { Calendar, Phone, MapPin, Clock, MessageSquare, Shield } from 'lucide-react';
import { ClinicSettings, WorkingHour } from '../types';

interface HeroProps {
  settings: ClinicSettings | null;
  workingHours: WorkingHour[];
  onOpenBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  workingHours,
  onOpenBooking,
}) => {
  const headline = settings?.hero_headline || 'Your Smile Deserves Expert Care';
  const subtext = settings?.hero_subtext || 'Professional dental care in Yargatti with a patient-first approach and convenient appointment booking.';
  const phone = settings?.phone || '+91 82960 74230';
  const cleanPhone = phone.replace(/\s+/g, '');
  const rawWhatsApp = settings?.whatsapp || '918296074230';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');

  // Calculate dynamic open status
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMin = currentHour * 60 + currentMinute;

  const todaySchedule = workingHours.find((h) => h.day_of_week === currentDay);
  let statusText = 'Closed Today';
  let hoursText = 'Reopens Monday 9:00 AM';
  let isOpenNow = false;

  if (todaySchedule && todaySchedule.is_open === 1) {
    const [openH, openM] = todaySchedule.open_time.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close_time.split(':').map(Number);
    const openTotalMin = openH * 60 + openM;
    const closeTotalMin = closeH * 60 + closeM;

    hoursText = `${todaySchedule.open_time} – ${todaySchedule.close_time}`;

    if (currentTotalMin >= openTotalMin && currentTotalMin < closeTotalMin) {
      statusText = 'Open Now';
      isOpenNow = true;
    } else if (currentTotalMin < openTotalMin) {
      statusText = 'Opens Today';
      hoursText = `at ${todaySchedule.open_time}`;
    } else {
      statusText = 'Closed for the day';
      hoursText = 'Opens tomorrow 9:00 AM';
    }
  }

  return (
    <section id="home" className="relative pt-6 pb-16 lg:pt-12 lg:pb-24 overflow-hidden bg-gradient-to-b from-teal-50/40 via-white to-neutral-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Trust kicker */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <span className="flex items-center gap-1.5 text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
            Verified Clinic
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Yargatti, Belagavi District</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Near KSRTC Bus Stand</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Description & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 text-balance leading-[1.12]">
              {headline}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {subtext}
            </p>

            {/* Clinic Quick Coordinates */}
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 bg-white/80 border border-slate-200/80 rounded-xl p-3 max-w-xl shadow-xs">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Ganagi Complex, 1st Floor</span>
                <span className="text-slate-500"> · Market Road, Above Mahantesh Photo Studio, Yargatti 591129</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-slate-900 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-sm transition-all focus-visible:outline-teal-600"
              >
                <Calendar className="w-4 h-4 text-teal-300" />
                <span>Book an Appointment</span>
              </button>

              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors focus-visible:outline-teal-600 shadow-xs"
              >
                <Phone className="w-4 h-4 text-teal-700" />
                <span>Call {phone}</span>
              </a>

              <a
                href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                  'Hello Dr. Vinayak Dental Clinic, I would like to enquire about booking a dental appointment.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors"
                title="Send a message on WhatsApp"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Reassurance notes */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Double-booking prevention active</span>
              </div>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>No pre-payment required</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Online confirmation receipt</span>
            </div>

          </div>

          {/* Right Column: Hero Visual & Dynamic Open Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
              
              {/* Operatory illustration / photography visual */}
              <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                <img
                  src="/gallery-operatory.svg"
                  alt="Modern sterile dental operatory at Dr. Vinayak Dental Clinic in Yargatti"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">Treatment Environment</p>
                  <p className="text-sm font-medium text-white/95">Sterile Operatory & Ergonomic Patient Suite</p>
                </div>
              </div>

              {/* Dynamic Status Bar within card */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isOpenNow ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500 ring-4 ring-amber-100'}`} />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{statusText}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-slate-600 font-normal">{hoursText}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Monday – Saturday: 9:00 AM – 8:00 PM
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    30-min slots
                  </span>
                </div>
              </div>

            </div>

            {/* Floating verification badge */}
            <div className="absolute -bottom-5 -left-4 hidden sm:flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm max-w-xs">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-900">Central Yargatti Landmark</div>
                <div className="text-slate-500 text-[11px]">Above Mahantesh Photo Studio</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
