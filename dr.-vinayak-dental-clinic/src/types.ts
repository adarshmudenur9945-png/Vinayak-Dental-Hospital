export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price_display: string;
  is_active: number;
  is_configured: number;
  details_treatment?: string;
  details_suitability?: string;
  details_prep?: string;
  details_aftercare?: string;
}

export interface Appointment {
  id: string;
  appointment_id: string;
  patient_name: string;
  phone: string;
  email?: string | null;
  age?: number | null;
  service_id: string;
  service_name?: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  contact_method: 'phone' | 'whatsapp' | 'email';
  reason?: string | null;
  admin_notes?: string | null;
  supabase_synced?: number;
  supabase_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicSettings {
  clinic_name: string;
  business_category: string;
  address_line1: string;
  address_landmark: string;
  address_city: string;
  address_state: string;
  address_pincode: string;
  address_country: string;
  phone: string;
  whatsapp: string;
  email: string;
  google_maps_url: string;
  google_maps_embed: string;
  hero_headline: string;
  hero_subtext: string;
  appointment_slot_duration: string;
  booking_advance_days: string;
  booking_notice_text: string;
  [key: string]: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  experience_years: string;
  registration_number: string;
  languages: string;
  biography: string;
  photo_url: string;
  is_configured: number;
}

export interface WorkingHour {
  day_of_week: number;
  day_name: string;
  is_open: number;
  open_time: string;
  close_time: string;
  break_start?: string | null;
  break_end?: string | null;
  slot_duration_minutes: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  caption: string;
  is_verified: number;
  display_order: number;
}

export interface SlotAvailability {
  time: string;
  available: boolean;
  isBooked: boolean;
  isPast: boolean;
}

export interface AvailabilityResponse {
  date: string;
  isOpen: boolean;
  reason?: string;
  dayName?: string;
  workingHours?: string;
  slotDuration?: number;
  slots: SlotAvailability[];
}
