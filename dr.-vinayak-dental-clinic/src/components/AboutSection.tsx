import React from 'react';
import { Calendar, CheckCircle2, ShieldCheck, MapPin, Languages, Award, FileText } from 'lucide-react';
import { DoctorProfile, ClinicSettings } from '../types';

interface AboutSectionProps {
  doctor: DoctorProfile | null;
  settings: ClinicSettings | null;
  onOpenBooking: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  doctor,
  settings,
  onOpenBooking,
}) => {
  const doctorName = doctor?.name || 'Dr. Vinayak';
  const qualification = doctor?.qualification || '[ADD VERIFIED QUALIFICATION (e.g. BDS, MDS)]';
  const specialization = doctor?.specialization || 'Dental Surgeon & General Dentistry';
  const experience = doctor?.experience_years || '[ADD VERIFIED YEARS OF EXPERIENCE]';
  const registration = doctor?.registration_number || '[ADD VERIFIED REGISTRATION NUMBER]';
  const languages = doctor?.languages || 'Kannada, English, Hindi';
  const biography = doctor?.biography || 'Dr. Vinayak provides personalized dental care at Dr. Vinayak Dental Clinic in Yargatti, Karnataka. Dedicated to providing patient-centered preventive, restorative, and routine oral healthcare in a comfortable, welcoming environment.';

  return (
    <section id="about" className="py-16 lg:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Clinic Narrative & Philosophy */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
                About The Practice
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Dedicated Dental Care for Yargatti and Surrounding Areas
              </h2>
            </div>

            <p className="text-base text-slate-600 leading-relaxed">
              Dr. Vinayak Dental Clinic provides dental care in Yargatti, Karnataka, with convenient consultation hours and appointment booking for patients seeking professional oral healthcare.
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              Situated centrally on Market Road near the KSRTC Bus Stand in Ganagi Complex, our practice focuses on thorough clinical consultations, clear explanation of treatment options, and patient comfort. Whether addressing sudden tooth discomfort or routine maintenance, care is provided with gentle technique and sterile clinical standards.
            </p>

            {/* Clinic Values list */}
            <div className="space-y-3 pt-2">
              {[
                { title: 'Transparent Communication', desc: 'No rushed diagnoses; procedures and care paths are explained clearly.' },
                { title: 'Hygienic Sterilization Protocols', desc: 'Strict sterilization of instruments with autoclaving before every patient visit.' },
                { title: 'Accessible Healthcare in Yargatti', desc: 'Convenient 9:00 AM to 8:00 PM hours with simple online scheduling.' },
              ].map((val) => (
                <div key={val.title} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-slate-900">{val.title}: </span>
                    <span className="text-slate-600">{val.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
              >
                <Calendar className="w-4 h-4 text-teal-300" />
                <span>Schedule a Consultation</span>
              </button>
            </div>
          </div>

          {/* Right Column: Doctor Profile Card */}
          <div className="lg:col-span-6">
            <div className="bg-neutral-50 rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
                {/* Doctor Portrait / Specialist Silhouette */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs shrink-0 relative">
                  <img
                    src="/placeholder-doctor.svg"
                    alt={`${doctorName} - Dental Surgeon at Dr. Vinayak Dental Clinic`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                    Lead Dental Practitioner
                  </div>
                  <h3 className="font-display text-2xl font-bold text-slate-900">
                    {doctorName}
                  </h3>
                  <p className="text-sm font-medium text-slate-700">
                    {specialization}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5 text-teal-600" />
                      <span>{languages}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Credentials Grid (Cleanly labeled with placeholders if unverified) */}
              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs">
                
                {/* Qualification */}
                <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Qualification:</span>
                  <span className={`font-semibold text-right ${qualification.includes('[ADD') ? 'text-amber-800 italic' : 'text-slate-900'}`}>
                    {qualification}
                  </span>
                </div>

                {/* Experience */}
                <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Experience:</span>
                  <span className={`font-semibold text-right ${experience.includes('[ADD') ? 'text-amber-800 italic' : 'text-slate-900'}`}>
                    {experience}
                  </span>
                </div>

                {/* Registration Number */}
                <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Dental Registration:</span>
                  <span className={`font-mono font-semibold text-right ${registration.includes('[ADD') ? 'text-amber-800 italic' : 'text-slate-900'}`}>
                    {registration}
                  </span>
                </div>

                {/* Biography */}
                <div className="pt-2">
                  <span className="text-slate-400 font-medium block mb-1">Professional Profile:</span>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {biography}
                  </p>
                </div>

              </div>

              {/* Action Button inside profile card */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Available for consults Mon – Sat
                </span>
                <button
                  onClick={onOpenBooking}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
                >
                  Book Consultation →
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
