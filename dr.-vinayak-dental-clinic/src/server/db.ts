import initSqlJs, { Database } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'clinic.sqlite');

let db: Database;

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price_display: string;
  is_active: number;
  is_configured: number; // 0 = placeholder to configure, 1 = verified by clinic
  details_treatment: string;
  details_suitability: string;
  details_prep: string;
  details_aftercare: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  appointment_id: string;
  patient_name: string;
  phone: string;
  email: string;
  age?: number | null;
  service_id: string;
  service_name?: string;
  doctor_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  contact_method: 'phone' | 'whatsapp' | 'email';
  reason?: string;
  admin_notes?: string;
  supabase_synced?: number;
  supabase_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicSetting {
  key: string;
  value: string;
}

export interface WorkingHour {
  day_of_week: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  day_name: string;
  is_open: number;
  open_time: string;
  close_time: string;
  break_start: string | null;
  break_end: string | null;
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
  category: string; // 'Clinic', 'Treatment Environment', 'Reception', 'Dental Equipment'
  image_url: string;
  caption: string;
  is_verified: number;
  display_order: number;
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

function persistDb() {
  if (!db) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error persisting database to disk:', err);
  }
}

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing database from', DB_PATH);
      setupTables();
      ensureAdminCredentials();
      return db;
    } catch (err) {
      console.error('Error loading existing sqlite file, initializing new one:', err);
    }
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new SQL.Database();
  console.log('Created fresh SQLite database');
  setupTables();
  seedInitialData();
  ensureAdminCredentials();
  persistDb();

  return db;
}

function setupTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS clinic_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS working_hours (
      day_of_week INTEGER PRIMARY KEY,
      day_name TEXT NOT NULL,
      is_open INTEGER NOT NULL DEFAULT 1,
      open_time TEXT NOT NULL DEFAULT '09:00',
      close_time TEXT NOT NULL DEFAULT '20:00',
      break_start TEXT,
      break_end TEXT,
      slot_duration_minutes INTEGER NOT NULL DEFAULT 30
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      price_display TEXT NOT NULL DEFAULT 'Consultation Based',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_configured INTEGER NOT NULL DEFAULT 0,
      details_treatment TEXT,
      details_suitability TEXT,
      details_prep TEXT,
      details_aftercare TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      qualification TEXT NOT NULL,
      specialization TEXT NOT NULL,
      experience_years TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      languages TEXT NOT NULL,
      biography TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      is_configured INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      appointment_id TEXT UNIQUE NOT NULL,
      patient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      age INTEGER,
      service_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'pending',
      contact_method TEXT NOT NULL DEFAULT 'phone',
      reason TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_slot_per_doctor UNIQUE (doctor_id, appointment_date, appointment_time)
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
    CREATE INDEX IF NOT EXISTS idx_appointments_code ON appointments(appointment_id);

    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      session_token TEXT,
      session_expires_at DATETIME
    );
  `);

  try {
    db.run("ALTER TABLE appointments ADD COLUMN supabase_synced INTEGER DEFAULT 0");
  } catch (e) {
    // Column already exists
  }
  try {
    db.run("ALTER TABLE appointments ADD COLUMN supabase_error TEXT");
  } catch (e) {
    // Column already exists
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function ensureAdminCredentials(): void {
  if (!db) return;
  const targetUsername = 'Adarsh';
  const targetPassword = 'Adarsh@123';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(targetPassword, salt);

  const existingUser = queryOne<{ id: string; username: string }>(
    "SELECT id, username FROM admin_users WHERE LOWER(username) = LOWER(?)",
    [targetUsername]
  );

  if (existingUser) {
    db.run(
      "UPDATE admin_users SET username = ?, password_hash = ?, salt = ? WHERE id = ?",
      [targetUsername, passwordHash, salt, existingUser.id]
    );
  } else {
    const oldAdmin = queryOne<{ id: string }>("SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1");
    if (oldAdmin) {
      db.run(
        "UPDATE admin_users SET username = ?, password_hash = ?, salt = ? WHERE id = ?",
        [targetUsername, passwordHash, salt, oldAdmin.id]
      );
    } else {
      db.run(
        "INSERT INTO admin_users (id, username, password_hash, salt) VALUES (?, ?, ?, ?)",
        ['admin-adarsh', targetUsername, passwordHash, salt]
      );
    }
  }
  persistDb();
  console.log('[Auth] Admin credentials updated for username: Adarsh');
}

function seedInitialData() {
  ensureAdminCredentials();

  // Clinic settings
  const settingsCheck = db.exec("SELECT COUNT(*) as count FROM clinic_settings");
  if (Number(settingsCheck[0]?.values[0]?.[0] || 0) === 0) {
    const defaultSettings: Record<string, string> = {
      clinic_name: 'DR. VINAYAK DENTAL CLINIC',
      business_category: 'Dental Clinic',
      address_line1: '1st Floor, Ganagi Complex, Market Road',
      address_landmark: 'Near KSRTC Bus Stand, Above Mahantesh Photo Studio',
      address_city: 'Yargatti',
      address_state: 'Karnataka',
      address_pincode: '591129',
      address_country: 'India',
      phone: '+91 82960 74230',
      whatsapp: '+918296074230',
      email: 'contact@drvinayakdental.com',
      google_maps_url: 'https://maps.google.com/?q=Ganagi+Complex,+Market+Road,+Yargatti,+Karnataka+591129',
      google_maps_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.824278455648!2d74.965!3d15.985!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTVzNTknMDYuMCJOIDc0wrA1Nyc1NC4wIkU!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
      hero_headline: 'Your Smile Deserves Expert Care',
      hero_subtext: 'Professional dental care in Yargatti with a patient-first approach and convenient appointment booking.',
      appointment_slot_duration: '30',
      booking_advance_days: '30',
      booking_notice_text: 'Appointments are subject to clinic confirmation. For emergency tooth pain or trauma, please call directly.',
    };

    for (const [k, v] of Object.entries(defaultSettings)) {
      db.run("INSERT INTO clinic_settings (key, value) VALUES (?, ?)", [k, v]);
    }
  }

  // Working Hours (Mon - Sat: 9:00 AM - 8:00 PM; Sun: Closed)
  const hoursCheck = db.exec("SELECT COUNT(*) as count FROM working_hours");
  if (Number(hoursCheck[0]?.values[0]?.[0] || 0) === 0) {
    const days = [
      { day_of_week: 0, day_name: 'Sunday', is_open: 0, open_time: '09:00', close_time: '13:00' },
      { day_of_week: 1, day_name: 'Monday', is_open: 1, open_time: '09:00', close_time: '20:00' },
      { day_of_week: 2, day_name: 'Tuesday', is_open: 1, open_time: '09:00', close_time: '20:00' },
      { day_of_week: 3, day_name: 'Wednesday', is_open: 1, open_time: '09:00', close_time: '20:00' },
      { day_of_week: 4, day_name: 'Thursday', is_open: 1, open_time: '09:00', close_time: '20:00' },
      { day_of_week: 5, day_name: 'Friday', is_open: 1, open_time: '09:00', close_time: '20:00' },
      { day_of_week: 6, day_name: 'Saturday', is_open: 1, open_time: '09:00', close_time: '20:00' },
    ];
    for (const d of days) {
      db.run(
        "INSERT INTO working_hours (day_of_week, day_name, is_open, open_time, close_time, slot_duration_minutes) VALUES (?, ?, ?, ?, ?, 30)",
        [d.day_of_week, d.day_name, d.is_open, d.open_time, d.close_time]
      );
    }
  }

  // Doctor Profile (Respecting verification instruction: No invented degrees/awards. Clear [ADD VERIFIED INFORMATION] placeholders editable in admin)
  const doctorCheck = db.exec("SELECT COUNT(*) as count FROM doctors");
  if (Number(doctorCheck[0]?.values[0]?.[0] || 0) === 0) {
    db.run(
      `INSERT INTO doctors (id, name, qualification, specialization, experience_years, registration_number, languages, biography, photo_url, is_configured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'doc-vinayak',
        'Dr. Vinayak',
        '[ADD VERIFIED QUALIFICATION (e.g. BDS, MDS)]',
        'Dental Surgeon & General Dentistry',
        '[ADD VERIFIED YEARS OF EXPERIENCE]',
        '[ADD VERIFIED REGISTRATION NUMBER]',
        'Kannada, English, Hindi',
        'Dr. Vinayak provides personalized dental care at Dr. Vinayak Dental Clinic in Yargatti, Karnataka. Dedicated to providing patient-centered preventive, restorative, and routine oral healthcare in a comfortable, welcoming environment.',
        '/placeholder-doctor.svg',
        0
      ]
    );
  }

  // Services Catalog (Catalog with placeholder indicator "is_configured: 0" so it shows as "Services to configure / Confirm with clinic")
  const servicesCheck = db.exec("SELECT COUNT(*) as count FROM services");
  if (Number(servicesCheck[0]?.values[0]?.[0] || 0) === 0) {
    const initialServices = [
      {
        id: 'srv-consultation',
        name: 'General Dental Consultation & Checkup',
        category: 'Consultation & Preventive',
        description: 'Comprehensive dental examination, oral health evaluation, and personalized care plan recommendation.',
        duration_minutes: 30,
        price_display: 'Consultation Fee (Inquire at clinic)',
        is_active: 1,
        is_configured: 1,
        details_treatment: 'A thorough visual and diagnostic assessment of your teeth, gums, and oral tissue. Includes oral health advice and discussion of recommended treatments.',
        details_suitability: 'Recommended for all patients at least twice a year, or when experiencing any discomfort, sensitivity, or oral health concerns.',
        details_prep: 'Brush your teeth before your visit. Bring any prior dental records, X-rays, or medications you are currently taking.',
        details_aftercare: 'Follow the specific oral hygiene routines and dietary guidance discussed during the consultation.'
      },
      {
        id: 'srv-cleaning',
        name: 'Professional Teeth Cleaning & Polishing',
        category: 'Preventive Care',
        description: 'Gentle ultrasonic scaling to remove plaque, calculus buildup, and surface stains to protect your gums.',
        duration_minutes: 45,
        price_display: 'To be quoted upon examination',
        is_active: 1,
        is_configured: 0,
        details_treatment: 'Careful removal of hard tartar deposits along and below the gumline using specialized dental scaling instruments followed by polishing.',
        details_suitability: 'Patients with bleeding gums, visible tartar accumulation, bad breath, or as a routine 6-month preventive treatment.',
        details_prep: 'Avoid heavy staining drinks (tea, coffee, turmeric) right before your appointment.',
        details_aftercare: 'Mild gum tenderness is normal for a few hours. Rinse with warm salt water if advised and maintain gentle brushing.'
      },
      {
        id: 'srv-fillings',
        name: 'Dental Fillings & Restorations',
        category: 'Restorative Care',
        description: 'Tooth-colored composite or restorative fillings to treat cavities and repair damaged or chipped teeth.',
        duration_minutes: 45,
        price_display: 'To be quoted upon examination',
        is_active: 1,
        is_configured: 0,
        details_treatment: 'Gentle decay removal followed by placement and bonding of a shade-matched restorative filling material to restore tooth anatomy.',
        details_suitability: 'Patients with dental caries, sensitivity to sweets or cold, or visible tooth decay and minor chipping.',
        details_prep: 'Have a light meal before your appointment. Inform the doctor of any local anesthetic allergies.',
        details_aftercare: 'Avoid chewing hard foods on the restored side for 2 hours if local anesthetic was administered.'
      },
      {
        id: 'srv-rct',
        name: 'Root Canal Treatment (RCT) Consultation',
        category: 'Endodontics',
        description: 'Relief from deep tooth decay and nerve infection while saving your natural tooth structure.',
        duration_minutes: 60,
        price_display: 'Consultation & assessment required',
        is_active: 1,
        is_configured: 0,
        details_treatment: 'Assessment of infected pulp tissue, thorough canal disinfection, and sterile canal sealing to prevent reinfection.',
        details_suitability: 'Patients experiencing severe, throbbing toothache, sensitivity to hot liquids, or localized gum swelling.',
        details_prep: 'Take any prescribed pain relief as advised by your doctor. Do not apply aspirin or hot objects directly onto the aching gum.',
        details_aftercare: 'Avoid chewing on the treated tooth until the final permanent crown or filling is placed.'
      },
      {
        id: 'srv-extraction',
        name: 'Tooth Extraction & Pain Relief',
        category: 'Oral Surgery',
        description: 'Gentle, sterile extraction of non-restorable teeth, severely decayed roots, or problematic wisdom teeth.',
        duration_minutes: 45,
        price_display: 'To be quoted upon examination',
        is_active: 1,
        is_configured: 0,
        details_treatment: 'Safe removal of the tooth under local anesthesia with careful socket preservation and clear post-extraction instructions.',
        details_suitability: 'Severely broken teeth, unrestorable decay, severe periodontal mobility, or impacted third molars causing pain.',
        details_prep: 'Eat a nutritious meal prior to the appointment. Disclose all blood-thinning medications or systemic conditions.',
        details_aftercare: 'Bite firmly on the sterile gauze pack for 45 minutes. Avoid spitting, smoking, or drinking through straws for 24 hours.'
      },
      {
        id: 'srv-crowns',
        name: 'Dental Crowns & Bridges',
        category: 'Prosthodontics',
        description: 'Custom ceramic, zirconia, or metal-ceramic restorations to protect weakened teeth and replace missing teeth.',
        duration_minutes: 45,
        price_display: 'To be quoted upon examination',
        is_active: 1,
        is_configured: 0,
        details_treatment: 'Precise tooth preparation, impression or digital scan, followed by custom fabrication and cemented placement.',
        details_suitability: 'Teeth that have undergone root canal treatment, large fractures, or replacing single/multiple missing teeth.',
        details_prep: 'Maintain thorough oral hygiene. We will discuss material choices and aesthetic expectations during consultation.',
        details_aftercare: 'Floss gently and avoid very sticky foods during the first 24 hours of cementation.'
      },
      {
        id: 'srv-pediatric',
        name: 'Pediatric Dental Care',
        category: 'Kids Dentistry',
        description: 'Friendly, patient, and gentle dental checkups, cavity prevention, and habit guidance for young children.',
        duration_minutes: 30,
        price_display: 'Consultation Based',
        is_active: 1,
        is_configured: 0,
        details_treatment: 'Gentle examination tailored for children, fluoride application, pit-and-fissure sealants, and positive habit counseling.',
        details_suitability: 'Children from the eruption of their first tooth through adolescence.',
        details_prep: 'Talk to your child positively about visiting the dentist. Avoid words that induce anxiety like "injection" or "pain".',
        details_aftercare: 'Assist with daily twice-a-day brushing and encourage healthy, low-sugar snacking habits.'
      }
    ];

    for (const s of initialServices) {
      db.run(
        `INSERT INTO services (id, name, category, description, duration_minutes, price_display, is_active, is_configured, details_treatment, details_suitability, details_prep, details_aftercare)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.name, s.category, s.description, s.duration_minutes, s.price_display, s.is_active, s.is_configured, s.details_treatment, s.details_suitability, s.details_prep, s.details_aftercare]
      );
    }
  }

  // FAQs
  const faqsCheck = db.exec("SELECT COUNT(*) as count FROM faqs");
  if (Number(faqsCheck[0]?.values[0]?.[0] || 0) === 0) {
    const initialFaqs = [
      {
        id: 'faq-1',
        question: 'What are the clinic timings?',
        answer: 'Dr. Vinayak Dental Clinic is open Monday through Saturday from 9:00 AM to 8:00 PM. The clinic is closed on Sundays.',
        display_order: 1
      },
      {
        id: 'faq-2',
        question: 'Where is Dr. Vinayak Dental Clinic located in Yargatti?',
        answer: 'The clinic is conveniently located on the 1st Floor of Ganagi Complex, Market Road, near the KSRTC Bus Stand, directly above Mahantesh Photo Studio in Yargatti, Karnataka 591129.',
        display_order: 2
      },
      {
        id: 'faq-3',
        question: 'How can I book an appointment?',
        answer: 'You can book your appointment directly online through this website by selecting your preferred service, date, and available time slot. You can also call us at +91 82960 74230 or message us on WhatsApp.',
        display_order: 3
      },
      {
        id: 'faq-4',
        question: 'Can I reschedule or cancel my appointment?',
        answer: 'Yes. You can manage, reschedule, or cancel your appointment anytime using your unique Appointment ID on the website, or by contacting the clinic directly via phone or WhatsApp at least 2 hours in advance.',
        display_order: 4
      },
      {
        id: 'faq-5',
        question: 'Do I need an appointment or can I walk in?',
        answer: 'We encourage booking an appointment to minimize waiting time and guarantee prompt attention. However, walk-in patients and emergency tooth pain cases are accommodated based on doctor availability.',
        display_order: 5
      },
      {
        id: 'faq-6',
        question: 'What should I bring for my first consultation visit?',
        answer: 'Please bring any previous dental X-rays, medical records, a list of current medications you take, and a valid phone number for appointment records.',
        display_order: 6
      }
    ];

    for (const f of initialFaqs) {
      db.run("INSERT INTO faqs (id, question, answer, display_order) VALUES (?, ?, ?, ?)", [f.id, f.question, f.answer, f.display_order]);
    }
  }

  // Gallery Placeholders
  const galleryCheck = db.exec("SELECT COUNT(*) as count FROM gallery");
  if (Number(galleryCheck[0]?.values[0]?.[0] || 0) === 0) {
    const initialGallery = [
      {
        id: 'gal-1',
        title: 'Dental Operatory & Patient Suite',
        category: 'Treatment Environment',
        image_url: '/gallery-operatory.svg',
        caption: 'Pristine, hygienic clinical treatment operatory with modern ergonomic patient chair.',
        is_verified: 0,
        display_order: 1
      },
      {
        id: 'gal-2',
        title: 'Clinic Reception & Waiting Lounge',
        category: 'Reception',
        image_url: '/gallery-reception.svg',
        caption: 'Comfortable, calm waiting lounge designed for patient comfort in Ganagi Complex.',
        is_verified: 0,
        display_order: 2
      },
      {
        id: 'gal-3',
        title: 'Diagnostic & Consultation Station',
        category: 'Clinic',
        image_url: '/gallery-consultation.svg',
        caption: 'Dedicated consultation area for one-on-one treatment explanation and dental education.',
        is_verified: 0,
        display_order: 3
      },
      {
        id: 'gal-4',
        title: 'Sterilization & Hygiene Equipment',
        category: 'Dental Equipment',
        image_url: '/gallery-equipment.svg',
        caption: 'Strict autoclave sterilization protocols following international hygiene guidelines.',
        is_verified: 0,
        display_order: 4
      }
    ];

    for (const g of initialGallery) {
      db.run(
        "INSERT INTO gallery (id, title, category, image_url, caption, is_verified, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [g.id, g.title, g.category, g.image_url, g.caption, g.is_verified, g.display_order]
      );
    }
  }
}

// Helper methods to query and mutate
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  persistDb();
}

export function verifyAdminSession(token: string): boolean {
  if (!token) return false;
  const user = queryOne<{ id: string; session_expires_at: string }>(
    "SELECT id, session_expires_at FROM admin_users WHERE session_token = ?",
    [token]
  );
  if (!user) return false;
  if (new Date(user.session_expires_at) < new Date()) {
    return false;
  }
  return true;
}

export function authenticateAdmin(username: string, pass: string): { success: boolean; token?: string; error?: string } {
  const user = queryOne<{ id: string; password_hash: string; salt: string }>(
    "SELECT id, password_hash, salt FROM admin_users WHERE LOWER(username) = LOWER(?)",
    [username.trim()]
  );
  if (!user) {
    return { success: false, error: 'Invalid username or password' };
  }

  const computedHash = hashPassword(pass, user.salt);
  if (computedHash !== user.password_hash) {
    return { success: false, error: 'Invalid username or password' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  execute(
    "UPDATE admin_users SET session_token = ?, session_expires_at = ? WHERE id = ?",
    [token, expiresAt, user.id]
  );

  return { success: true, token };
}

export function getClinicSettings(): Record<string, string> {
  const rows = queryAll<{ key: string; value: string }>("SELECT key, value FROM clinic_settings");
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
}
