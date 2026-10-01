import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TrustSection } from './components/TrustSection';
import { ServicesSection } from './components/ServicesSection';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { AboutSection } from './components/AboutSection';
import { GallerySection } from './components/GallerySection';
import { FAQSection } from './components/FAQSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { MobileStickyBar } from './components/MobileStickyBar';
import { AppointmentWizard } from './components/AppointmentWizard';
import { BookingLookupModal } from './components/BookingLookupModal';
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { AdminPortal } from './components/admin/AdminPortal';
import {
  Service,
  ClinicSettings,
  DoctorProfile,
  WorkingHour,
  FAQItem,
  GalleryItem,
  Appointment
} from './types';

export default function App() {
  // Clinic Data
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Navigation
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<Service | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [privacyTermsType, setPrivacyTermsType] = useState<'privacy' | 'terms' | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');

  // Load clinic data from API
  const loadData = async () => {
    try {
      const [clinicRes, srvRes, faqRes, galRes] = await Promise.all([
        fetch('/api/clinic'),
        fetch('/api/services'),
        fetch('/api/faqs'),
        fetch('/api/gallery'),
      ]);

      if (clinicRes.ok) {
        const cData = await clinicRes.json();
        setSettings(cData.settings);
        setDoctor(cData.doctor);
        setWorkingHours(cData.workingHours || []);
      }

      if (srvRes.ok) {
        setServices(await srvRes.json());
      }

      if (faqRes.ok) {
        setFaqs(await faqRes.json());
      }

      if (galRes.ok) {
        setGalleryItems(await galRes.json());
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Scroll spy for active navigation state
    const handleScroll = () => {
      const sections = ['home', 'services', 'about', 'gallery', 'faq', 'contact'];
      const scrollPos = window.scrollY + 120;

      for (const s of sections) {
        const el = document.getElementById(s);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(s);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenBooking = (serviceId?: string) => {
    setPreSelectedServiceId(serviceId);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      
      {/* 1. Top Navigation Bar */}
      <Header
        settings={settings}
        onOpenBooking={handleOpenBooking}
        onOpenLookup={() => setIsLookupOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeSection={activeSection}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          settings={settings}
          workingHours={workingHours}
          onOpenBooking={handleOpenBooking}
        />

        {/* 3. Verified Principles & Trust Section */}
        <TrustSection />

        {/* 4. Dental Services Catalog */}
        <ServicesSection
          services={services}
          onOpenBooking={handleOpenBooking}
          onSelectServiceDetail={(srv) => setSelectedServiceDetail(srv)}
        />

        {/* 5. About Practice & Doctor Profile */}
        <AboutSection
          doctor={doctor}
          settings={settings}
          onOpenBooking={() => handleOpenBooking('srv-consultation')}
        />

        {/* 6. Clinic Photo Tour & Facilities */}
        <GallerySection galleryItems={galleryItems} />

        {/* 7. Patient Inquiries & FAQs */}
        <FAQSection faqs={faqs} settings={settings} />

        {/* 8. Location, Timing & Interactive Maps */}
        <ContactSection
          settings={settings}
          workingHours={workingHours}
          onOpenBooking={handleOpenBooking}
        />
      </main>

      {/* 9. Comprehensive Footer */}
      <Footer
        settings={settings}
        onOpenPrivacy={() => setPrivacyTermsType('privacy')}
        onOpenTerms={() => setPrivacyTermsType('terms')}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* 10. Sticky Mobile Actions Bar (strictly capped under 15% viewport height) */}
      <MobileStickyBar
        settings={settings}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* 11. Multi-Step Appointment Booking Wizard */}
      <AppointmentWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preSelectedServiceId={preSelectedServiceId}
        services={services}
        settings={settings}
        onBookingSuccess={() => {
          loadData();
        }}
      />

      {/* 12. Service Detail Modal */}
      <ServiceDetailModal
        service={selectedServiceDetail}
        settings={settings}
        onClose={() => setSelectedServiceDetail(null)}
        onBookService={(srvId) => {
          setSelectedServiceDetail(null);
          handleOpenBooking(srvId);
        }}
      />

      {/* 13. Patient Booking Lookup & Reschedule Modal */}
      <BookingLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        settings={settings}
      />

      {/* 14. Secure Admin Management Portal */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataChanged={loadData}
      />

      {/* 15. Privacy & Terms Modal */}
      <PrivacyTermsModal
        isOpen={privacyTermsType !== null}
        type={privacyTermsType || 'privacy'}
        onClose={() => setPrivacyTermsType(null)}
        settings={settings}
      />

    </div>
  );
}
