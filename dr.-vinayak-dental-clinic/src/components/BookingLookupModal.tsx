import React, { useState } from 'react';
import { X, Search, Calendar, Phone, AlertCircle, CheckCircle, Clock, Trash2, RefreshCw } from 'lucide-react';
import { Appointment, ClinicSettings } from '../types';

interface BookingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClinicSettings | null;
}

export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [queryType, setQueryType] = useState<'code' | 'phone'>('code');
  const [searchValue, setSearchValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Appointment[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [rescheduleLoading, setRescheduleLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setActionSuccessMsg(null);
      const param = queryType === 'code' ? `code=${encodeURIComponent(searchValue.trim())}` : `phone=${encodeURIComponent(searchValue.trim())}`;
      const res = await fetch(`/api/appointments/lookup?${param}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search');
      }
      setResults(data);
      if (data.length === 0) {
        setErrorMsg('No appointment found matching that reference. Please verify your details or contact the clinic.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lookup failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this dental appointment?')) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: appointmentId,
          reason: 'Cancelled by patient via portal',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');

      setActionSuccessMsg('Appointment cancelled successfully.');
      // Refresh list
      setResults((prev) =>
        prev
          ? prev.map((a) =>
              a.appointment_id === appointmentId ? { ...a, status: 'cancelled' } : a
            )
          : []
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cancelling appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (appointmentId: string) => {
    if (!newDate || !newTime) {
      setErrorMsg('Please select both a new date and time');
      return;
    }

    try {
      setRescheduleLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/appointments/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: appointmentId,
          new_date: newDate,
          new_time: newTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule');

      setActionSuccessMsg('Appointment rescheduled successfully.');
      setReschedulingId(null);
      setResults((prev) =>
        prev
          ? prev.map((a) =>
              a.appointment_id === appointmentId
                ? { ...a, appointment_date: newDate, appointment_time: newTime, status: 'pending' }
                : a
            )
          : []
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rescheduling appointment');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const clinicPhone = settings?.phone || '+91 82960 74230';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lookup-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-300" />
            <h2 id="lookup-modal-title" className="font-display font-bold text-base">
              Track or Manage Appointment
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Query Type Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setQueryType('code');
                setResults(null);
                setSearchValue('');
              }}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                queryType === 'code' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Appointment ID (e.g. VIN-2026-...)
            </button>
            <button
              type="button"
              onClick={() => {
                setQueryType('phone');
                setResults(null);
                setSearchValue('');
              }}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                queryType === 'phone' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Registered Phone Number
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type={queryType === 'code' ? 'text' : 'tel'}
              required
              placeholder={queryType === 'code' ? 'VIN-2026-XXXX' : 'e.g. 9876543210'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors shrink-0"
            >
              {loading ? 'Searching...' : 'Find Booking'}
            </button>
          </form>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {actionSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{actionSuccessMsg}</div>
            </div>
          )}

          {/* Results List */}
          {results && results.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Found Appointments ({results.length})
              </h3>

              {results.map((appt) => {
                const isCancelled = appt.status === 'cancelled';
                const isCompleted = appt.status === 'completed';

                return (
                  <div
                    key={appt.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold text-slate-900 block">
                          {appt.appointment_id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {appt.patient_name} · {appt.phone}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                          appt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : appt.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block">Treatment:</span>
                        <span className="font-medium text-slate-800">{appt.service_name || 'General Dental Consultation'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Date & Time:</span>
                        <span className="font-medium text-slate-800">{appt.appointment_date} at {appt.appointment_time}</span>
                      </div>
                    </div>

                    {/* Reschedule form expansion */}
                    {reschedulingId === appt.appointment_id && (
                      <div className="p-3 bg-white rounded-lg border border-teal-200 space-y-2 text-xs">
                        <span className="font-semibold text-slate-800 block">Pick New Date & Time Slot:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="p-1.5 rounded border border-slate-300 text-xs"
                          />
                          <select
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="p-1.5 rounded border border-slate-300 text-xs"
                          >
                            <option value="">Select Time</option>
                            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setReschedulingId(null)}
                            className="px-2.5 py-1 text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={rescheduleLoading}
                            onClick={() => handleReschedule(appt.appointment_id)}
                            className="px-3 py-1 bg-teal-700 text-white font-semibold rounded hover:bg-teal-800"
                          >
                            {rescheduleLoading ? 'Saving...' : 'Confirm Reschedule'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions if not cancelled or completed */}
                    {!isCancelled && !isCompleted && reschedulingId !== appt.appointment_id && (
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReschedulingId(appt.appointment_id);
                              setNewDate(appt.appointment_date);
                              setNewTime(appt.appointment_time);
                            }}
                            className="inline-flex items-center gap-1 text-teal-700 font-semibold hover:underline"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reschedule</span>
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={() => handleCancel(appt.appointment_id)}
                            className="inline-flex items-center gap-1 text-rose-600 font-semibold hover:underline"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>

                        <a
                          href={`tel:${clinicPhone.replace(/\s+/g, '')}`}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          Need help? Call clinic
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Need immediate assistance?</span>
          <a
            href={`tel:${clinicPhone.replace(/\s+/g, '')}`}
            className="font-semibold text-teal-800 hover:underline flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            <span>Call {clinicPhone}</span>
          </a>
        </div>

      </div>
    </div>
  );
};
