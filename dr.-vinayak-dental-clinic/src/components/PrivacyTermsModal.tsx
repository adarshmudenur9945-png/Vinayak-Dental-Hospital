import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { ClinicSettings } from '../types';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  type: 'privacy' | 'terms';
  onClose: () => void;
  settings: ClinicSettings | null;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  type,
  onClose,
  settings,
}) => {
  if (!isOpen) return null;

  const clinicName = settings?.clinic_name || 'DR. VINAYAK DENTAL CLINIC';
  const phone = settings?.phone || '+91 82960 74230';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h2 className="font-display font-bold text-base sm:text-lg">
              {type === 'privacy' ? 'Patient Privacy Policy' : 'Terms & Conditions of Service'}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <p>
                <strong>Last Updated: September 2026</strong>
              </p>
              <p>
                At <strong>{clinicName}</strong>, located at 1st Floor, Ganagi Complex, Market Road, Near KSRTC Bus Stand, Yargatti, Karnataka 591129, we take the confidentiality and privacy of our patients seriously.
              </p>
              <h3 className="font-bold text-slate-900 text-sm pt-2">1. Information We Collect</h3>
              <p>
                When you schedule an appointment via our website, we collect your name, contact phone number, email address (if provided), age, and any optional notes concerning your reason for consultation.
              </p>
              <h3 className="font-bold text-slate-900 text-sm pt-2">2. Purpose of Collection</h3>
              <p>
                We use your details solely to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Schedule and maintain your dental appointment time slot.</li>
                <li>Contact you via Phone, WhatsApp, or Email regarding booking confirmations or schedule adjustments.</li>
                <li>Ensure accurate clinical check-in when you arrive at our Yargatti clinic.</li>
              </ul>
              <h3 className="font-bold text-slate-900 text-sm pt-2">3. Data Protection & Sharing</h3>
              <p>
                We do not sell, rent, or trade your personal or appointment information to any third parties or marketing brokers. Your information is accessed solely by authorized clinic personnel.
              </p>
              <h3 className="font-bold text-slate-900 text-sm pt-2">4. Contact & Inquiries</h3>
              <p>
                For questions regarding your data or to request record removal, please contact the clinic directly at {phone}.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Last Updated: September 2026</strong>
              </p>
              <p>
                Welcome to the official appointment portal for <strong>{clinicName}</strong>.
              </p>
              <h3 className="font-bold text-slate-900 text-sm pt-2">1. Appointment Requests</h3>
              <p>
                Online booking requests represent an advance slot reservation with Dr. Vinayak Dental Clinic. Although we make every effort to adhere precisely to scheduled times, dental emergencies or unforeseen patient care needs may occasionally necessitate minor timing adjustments.
              </p>
              <h3 className="font-bold text-slate-900 text-sm pt-2">2. Cancellations & Rescheduling</h3>
              <p>
                If you need to reschedule or cancel your appointment, we kindly request notice at least 2 hours prior to your scheduled time slot, either via the online portal or by calling {phone}.
              </p>
              <h3 className="font-bold text-slate-900 text-sm pt-2">3. Medical Disclaimer</h3>
              <p>
                Information published on this website regarding dental procedures, treatments, aftercare, and oral hygiene is intended for general informational purposes only and does not constitute a definitive medical diagnosis or replace a personalized clinical examination by Dr. Vinayak.
              </p>
              <h3 className="font-bold text-slate-900 text-sm pt-2">4. Clinic Location & Hours</h3>
              <p>
                Consultations take place at our practice: 1st Floor, Ganagi Complex, Market Road, Near KSRTC Bus Stand, Yargatti, Karnataka 591129. Operating hours are Monday to Saturday from 9:00 AM to 8:00 PM.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
