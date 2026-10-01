import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Download,
  MessageCircle,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Service, ClinicSettings, AvailabilityResponse, Appointment } from '../types';

interface AppointmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedServiceId?: string;
  services: Service[];
  settings: ClinicSettings | null;
  onBookingSuccess?: (appointment: Appointment) => void;
}

export const AppointmentWizard: React.FC<AppointmentWizardProps> = ({
  isOpen,
  onClose,
  preSelectedServiceId,
  services,
  settings,
  onBookingSuccess,
}) => {
  // Wizard Steps: 1: Service, 2: Date & Time, 3: Patient Info, 4: Confirmed
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const [patientName, setPatientName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [contactMethod, setContactMethod] = useState<'phone' | 'whatsapp' | 'email'>('phone');
  const [reason, setReason] = useState<string>('');
  const [consentAccepted, setConsentAccepted] = useState<boolean>(true);

  // Availability State
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Confirmed Appointment Result
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Calendar month navigation
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Initialize service when opened or changed
  useEffect(() => {
    if (isOpen) {
      if (preSelectedServiceId) {
        setSelectedServiceId(preSelectedServiceId);
      } else if (!selectedServiceId && services.length > 0) {
        setSelectedServiceId(services[0].id);
      }

      // Default date to tomorrow if not set, avoiding Sundays
      if (!selectedDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDay() === 0) {
          // If tomorrow is Sunday, skip to Monday
          tomorrow.setDate(tomorrow.getDate() + 1);
        }
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, preSelectedServiceId, services]);

  // Fetch slots whenever selectedDate or selectedServiceId changes
  useEffect(() => {
    if (selectedDate && isOpen) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, selectedServiceId, isOpen]);

  const fetchAvailability = async (dateStr: string) => {
    try {
      setLoadingAvailability(true);
      setErrorMsg(null);
      const res = await fetch(`/api/availability?date=${dateStr}&service_id=${selectedServiceId}`);
      if (!res.ok) {
        throw new Error('Failed to load slots');
      }
      const data: AvailabilityResponse = await res.json();
      setAvailability(data);

      // If currently selected time is not available in the new slots, clear it
      if (selectedTime) {
        const stillAvailable = data.slots.some((s) => s.time === selectedTime && s.available);
        if (!stillAvailable) {
          setSelectedTime('');
        }
      }
    } catch (err: any) {
      setErrorMsg('Could not fetch clinic availability for this date.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!patientName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }
    if (!selectedServiceId || !selectedDate || !selectedTime) {
      setErrorMsg('Please select a service, date, and available time slot');
      return;
    }
    if (!consentAccepted) {
      setErrorMsg('Please accept the privacy and contact consent');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          age: age ? Number(age) : undefined,
          service_id: selectedServiceId,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          contact_method: contactMethod,
          reason: reason.trim() || undefined,
          consent_accepted: consentAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm booking');
      }

      setConfirmedAppointment(data.appointment);
      setStep(4);
      onBookingSuccess?.(data.appointment);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0D9488', '#0F2942', '#38BDF8', '#10B981'],
        });
      } catch (cErr) {
        // ignore if blocked
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Booking submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar Helpers
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth(); // 0-indexed
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    const today = new Date();
    if (year === today.getFullYear() && month <= today.getMonth()) return;
    setCalendarMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  const isDateDisabled = (dayNum: number): boolean => {
    const dateObj = new Date(year, month, dayNum);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates
    if (dateObj < today) return true;
    // Disable Sundays (clinic is closed on Sundays)
    if (dateObj.getDay() === 0) return true;

    // Limit to configured advance booking days (default 30 days)
    const maxDays = Number(settings?.booking_advance_days || 30);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxDays);
    if (dateObj > maxDate) return true;

    return false;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar .ics generator
  const downloadICS = () => {
    if (!confirmedAppointment) return;
    const startStr = `${confirmedAppointment.appointment_date.replace(/-/g, '')}T${confirmedAppointment.appointment_time.replace(':', '')}00`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dr. Vinayak Dental Clinic//Appointment Booking//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Dental Appointment - Dr. Vinayak Dental Clinic`,
      `DESCRIPTION:Appointment for ${confirmedAppointment.patient_name} (${confirmedAppointment.service_name || 'Dental Consultation'}). Appointment ID: ${confirmedAppointment.appointment_id}`,
      `LOCATION:1st Floor, Ganagi Complex, Market Road, Near KSRTC Bus Stand, Yargatti 591129`,
      `DTSTART:${startStr}`,
      `DTEND:${startStr}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Appointment-${confirmedAppointment.appointment_id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const clinicPhone = settings?.phone || '+91 82960 74230';
  const cleanClinicPhone = clinicPhone.replace(/\s+/g, '');
  const rawWhatsApp = settings?.whatsapp || '918296074230';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-wizard-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Wizard Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="booking-wizard-title" className="font-display font-bold text-base sm:text-lg leading-tight">
                {step === 4 ? 'Appointment Request Confirmed' : 'Book Dental Appointment'}
              </h2>
              <p className="text-[11px] text-teal-200/80">
                DR. VINAYAK DENTAL CLINIC · Yargatti
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Only on steps 1-3) */}
        {step < 4 && (
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5">
            <div className="flex items-center justify-between max-w-md mx-auto text-xs font-semibold">
              
              <button
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 ${
                  step >= 1 ? 'text-teal-700' : 'text-slate-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 1 ? 'bg-slate-900 text-white' : step > 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>1</span>
                <span>Service</span>
              </button>

              <span className="text-slate-300">──</span>

              <button
                onClick={() => {
                  if (selectedServiceId) setStep(2);
                }}
                disabled={!selectedServiceId}
                className={`flex items-center gap-1.5 ${
                  step >= 2 ? 'text-teal-700' : 'text-slate-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 2 ? 'bg-slate-900 text-white' : step > 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>2</span>
                <span>Date & Time</span>
              </button>

              <span className="text-slate-300">──</span>

              <button
                onClick={() => {
                  if (selectedServiceId && selectedDate && selectedTime) setStep(3);
                }}
                disabled={!selectedServiceId || !selectedDate || !selectedTime}
                className={`flex items-center gap-1.5 ${
                  step >= 3 ? 'text-teal-700' : 'text-slate-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 3 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}>3</span>
                <span>Your Details</span>
              </button>

            </div>
          </div>
        )}

        {/* Wizard Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* ----------------- STEP 1: CHOOSE SERVICE ----------------- */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Step 1: Select Dental Treatment
                </h3>
                <span className="text-xs text-slate-500">
                  {services.length} services available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {services.map((s) => {
                  const isSelected = selectedServiceId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServiceId(s.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-medium text-teal-800">{s.category}</span>
                          <span className="tabular-nums">{s.duration_minutes} min</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-1">
                          {s.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {s.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{s.price_display}</span>
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-teal-700' : 'text-slate-400'}`}>
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------- STEP 2: CHOOSE DATE & TIME ----------------- */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Selected service summary pill */}
              <div className="flex items-center justify-between p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Selected Service:</span>
                  <span className="font-bold text-teal-950 text-sm">{selectedService?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-teal-700 font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Two Columns: Date Picker + Time Slots */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Date Picker (Calendar) */}
                <div className="md:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-900">
                      {monthNames[month]} {year}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={prevMonth}
                        aria-label="Previous month"
                        className="p-1 rounded text-slate-600 hover:bg-slate-200"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextMonth}
                        aria-label="Next month"
                        className="p-1 rounded text-slate-600 hover:bg-slate-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* Day Cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Blank offset for first day */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`blank-${i}`} className="h-8" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const disabled = isDateDisabled(dayNum);
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isSelected = selectedDate === dateStr;

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`h-8 w-full rounded-md text-xs font-medium flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-slate-900 text-white font-bold shadow-xs'
                              : disabled
                              ? 'text-slate-300 cursor-not-allowed bg-transparent'
                              : 'text-slate-700 hover:bg-teal-100 hover:text-teal-900'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>* Sundays closed</span>
                    <span>Slots: 9 AM - 8 PM</span>
                  </div>
                </div>

                {/* Time Slots Column */}
                <div className="md:col-span-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      Available Time Slots
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {selectedDate || 'Select a date'}
                    </span>
                  </div>

                  {loadingAvailability ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Checking clinic availability...
                    </div>
                  ) : !availability?.isOpen ? (
                    <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center text-xs text-amber-900">
                      <p className="font-semibold">{availability?.reason || 'Clinic is closed on this date'}</p>
                      <p className="mt-1 text-slate-500">Please choose another working day (Monday - Saturday).</p>
                    </div>
                  ) : availability.slots.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      No slots available for this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {availability.slots.map((s) => {
                        const isChosen = selectedTime === s.time;
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={!s.available}
                            onClick={() => setSelectedTime(s.time)}
                            className={`py-2 px-2 rounded-lg text-xs font-medium text-center border transition-all ${
                              isChosen
                                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                                : s.isBooked
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                : s.isPast
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                            }`}
                          >
                            <span className="tabular-nums">{s.time}</span>
                            {s.isBooked && (
                              <span className="block text-[9px] text-slate-400">Booked</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedTime && (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                      <span className="font-semibold">Selected: {selectedDate} at {selectedTime}</span>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ----------------- STEP 3: PATIENT INFORMATION ----------------- */}
          {step === 3 && (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              
              {/* Summary Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block">Service:</span>
                  <span className="font-semibold text-slate-900 truncate block">{selectedService?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date:</span>
                  <span className="font-semibold text-slate-900">{selectedDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Time Slot:</span>
                  <span className="font-semibold text-slate-900">{selectedTime}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patil"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (10 digits) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="e.g. patient@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>

                {/* Patient Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    placeholder="e.g. 32"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Contact Method for Confirmation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'phone', label: 'Phone Call' },
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'email', label: 'Email' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setContactMethod(m.id as any)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-colors ${
                        contactMethod === m.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason for visit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Visit / Any Symptoms (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mild sensitivity in lower molar when drinking cold water"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="consent"
                  required
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="consent" className="text-xs text-slate-600 leading-normal">
                  I agree to Dr. Vinayak Dental Clinic using my submitted information to contact me regarding my appointment schedule.
                </label>
              </div>

              {/* Hidden submit trigger from footer button */}
              <button type="submit" id="wizard-submit-btn" className="hidden" />
            </form>
          )}

          {/* ----------------- STEP 4: CONFIRMATION RECEIPT ----------------- */}
          {step === 4 && confirmedAppointment && (
            <div className="space-y-6">
              
              {/* Success Badge */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Appointment Request Confirmed!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Thank you, <strong className="text-slate-800">{confirmedAppointment.patient_name}</strong>. Your dental visit request has been logged in the clinic system.
                </p>
              </div>

              {/* Appointment Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                
                {/* ID Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Appointment ID
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900">
                      {confirmedAppointment.appointment_id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Status
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" />
                      Received
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Service</span>
                    <span className="font-semibold text-slate-900">
                      {confirmedAppointment.service_name || selectedService?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Date & Time</span>
                    <span className="font-semibold text-slate-900">
                      {confirmedAppointment.appointment_date} at {confirmedAppointment.appointment_time}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Patient Name</span>
                    <span className="font-semibold text-slate-900">
                      {confirmedAppointment.patient_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Contact Phone</span>
                    <span className="font-semibold text-slate-900">
                      {confirmedAppointment.phone}
                    </span>
                  </div>
                </div>

                {/* Address block */}
                <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Clinic Location:</span>
                    <p className="text-[11px] text-slate-500">
                      1st Floor, Ganagi Complex, Market Road, Near KSRTC Bus Stand, Above Mahantesh Photo Studio, Yargatti, Karnataka 591129
                    </p>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <button
                  onClick={downloadICS}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Add to Calendar</span>
                </button>

                <a
                  href={`tel:${cleanClinicPhone}`}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Call Clinic</span>
                </a>

                <a
                  href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                    `Hello Dr. Vinayak Dental Clinic, I booked an appointment. ID: ${confirmedAppointment.appointment_id} for ${confirmedAppointment.appointment_date} at ${confirmedAppointment.appointment_time}. Name: ${confirmedAppointment.patient_name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href="https://maps.google.com/?q=Ganagi+Complex,+Market+Road,+Yargatti,+Karnataka+591129"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Directions</span>
                </a>
              </div>

            </div>
          )}

        </div>

        {/* Wizard Footer Navigation */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                disabled={!selectedServiceId}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-xs transition-colors"
              >
                <span>Continue to Date & Time</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-xs transition-colors"
              >
                <span>Continue to Patient Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  const submitBtn = document.getElementById('wizard-submit-btn');
                  submitBtn?.click();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                {submitting ? (
                  <span>Checking & Reserving Slot...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-teal-300" />
                    <span>Confirm Appointment</span>
                  </>
                )}
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
