import React, { useState, useEffect } from 'react';
import { Menu, X, Calendar, Search, Phone, ShieldCheck } from 'lucide-react';
import { ClinicSettings } from '../types';

interface HeaderProps {
  settings: ClinicSettings | null;
  onOpenBooking: (serviceId?: string) => void;
  onOpenLookup: () => void;
  onOpenAdmin: () => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenBooking,
  onOpenLookup,
  onOpenAdmin,
  activeSection
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const clinicName = settings?.clinic_name || 'DR. VINAYAK DENTAL CLINIC';
  const phone = settings?.phone || '+91 82960 74230';

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Location', href: '#contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-neutral-200/80 py-3'
          : 'bg-white border-b border-neutral-100 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Zone 1: Brand Wordmark with clean tooth emblem */}
          <a
            href="#home"
            className="flex items-center gap-2.5 group focus-visible:outline-teal-600 rounded-md"
            aria-label="Dr. Vinayak Dental Clinic Home"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-teal-400 shadow-xs transition-transform group-hover:scale-105">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C7.5 2 5 5 5 9.5C5 14 7.5 18 9.5 22C10 23 11 23 11.5 21.5L12 19L12.5 21.5C13 23 14 23 14.5 22C16.5 18 19 14 19 9.5C19 5 16.5 2 12 2ZM12 7C12.8 7 13.5 7.7 13.5 8.5C13.5 9.3 12.8 10 12 10C11.2 10 10.5 9.3 10.5 8.5C10.5 7.7 11.2 7 12 7Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
                {clinicName}
              </span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Yargatti · Dental Care
              </span>
            </div>
          </a>

          {/* Zone 2: Navigation Links (single line, subtle hover) */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-teal-700 whitespace-nowrap ${
                  activeSection === link.href.replace('#', '')
                    ? 'text-teal-700 font-semibold'
                    : 'text-slate-600'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Zone 3: Actions (Admin Portal, Lookup, Phone & Primary Book CTA) */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3">
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
              title="Clinic Staff & Doctor Administration Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Admin Portal</span>
            </button>

            <button
              onClick={onOpenLookup}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              title="Check appointment status or reschedule"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Track Booking</span>
            </button>

            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-teal-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>{phone}</span>
            </a>

            <button
              onClick={() => onOpenBooking()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-xs transition-colors whitespace-nowrap focus-visible:outline-teal-600"
            >
              <Calendar className="w-4 h-4 text-teal-300" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenLookup}
              aria-label="Track booking"
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-lg focus-visible:outline-teal-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-100">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-slate-50 rounded-md"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-lg shadow-xs"
            >
              <Calendar className="w-4 h-4 text-teal-300" />
              <span>Book Appointment</span>
            </button>

            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              <Phone className="w-4 h-4 text-teal-700" />
              <span>Call Clinic ({phone})</span>
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 pt-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Clinic Staff Login</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
