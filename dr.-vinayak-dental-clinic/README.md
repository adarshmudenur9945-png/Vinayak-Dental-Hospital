# DR. VINAYAK DENTAL CLINIC — Premium Appointment Booking Platform

A modern, production-grade appointment booking and clinic management web application built for **Dr. Vinayak Dental Clinic** in Yargatti, Karnataka.

---

## 1. Verified Business Information

| Field | Detail |
|---|---|
| **Business Name** | DR. VINAYAK DENTAL CLINIC |
| **Category** | Dental Clinic |
| **Address** | 1st Floor, Ganagi Complex, Market Road, Near KSRTC Bus Stand, Above Mahantesh Photo Studio, Yargatti, Karnataka 591129, India |
| **Phone** | +91 82960 74230 |
| **WhatsApp** | +91 82960 74230 |
| **Consultation Hours** | Monday – Saturday: 9:00 AM – 8:00 PM<br>Sunday: Closed / Not listed |
| **Landmark** | Above Mahantesh Photo Studio, opposite KSRTC bus approach |

> **Content Accuracy Compliance**: No doctor credentials, patient counts, or prices are fabricated. Unverified doctor profile fields display explicit `[ADD VERIFIED INFORMATION]` placeholders editable directly in the clinic admin portal.

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express, Vite middleware in development.
- **Relational Database**: Relational SQLite database engine (`sql.js`) with ACID transactions, foreign keys, and unique slot constraints (`UNIQUE(doctor_id, appointment_date, appointment_time)`).
- **Security**: Scrypt password hashing with unique per-user cryptographic salts, Bearer session tokens with expiry, server-side duplicate slot validation, sanitized SQL queries.

---

## 3. Database Schema

The database is persisted at `data/clinic.sqlite` and bootstrapped automatically with initial seeds:

- **`clinic_settings`**: Key-value store for clinic address, phone, WhatsApp, Google Maps URL, embed code, and booking notice rules.
- **`working_hours`**: Day-of-week configuration (0–6), open time, close time, break intervals, open/closed flags, and customizable slot duration (default 30 mins).
- **`services`**: Dental service catalog with duration, category, pricing display, active flag, configured flag, treatment explanation, suitability, preparation, and aftercare.
- **`doctors`**: Doctor profile for Dr. Vinayak (qualification, specialization, experience, registration number, languages, biography, photo).
- **`appointments`**: Appointment table with `appointment_id` (e.g. `VIN-2026-8941`), patient name, phone, email, age, service ID, doctor ID, date, time, duration, status (`pending`, `confirmed`, `completed`, `cancelled`, `no-show`), contact preference, reason, and admin notes. Includes a `UNIQUE(doctor_id, appointment_date, appointment_time)` constraint preventing database double-booking.
- **`gallery`**: Clinic facility and operatory photo records with verified status and category.
- **`faqs`**: Patient FAQ items with display order and active state.
- **`admin_users`**: Administrative credentials, cryptographic salt, password hash, and session tokens.

---

## 4. API Endpoints

### Public Endpoints
- `GET /api/clinic`: Returns clinic coordinates, working hours, and doctor profile.
- `GET /api/services`: Returns list of active clinical treatments.
- `GET /api/availability?date=YYYY-MM-DD`: Calculates real-time time slots for a given day, checking existing bookings and disabling booked/past times and closed days (Sundays).
- `POST /api/appointments`: Books an appointment with server-side validation and double-booking rejection (returns `409 Conflict` if slot was just taken).
- `GET /api/appointments/lookup?code=...&phone=...`: Allows patients to view their appointment status anytime.
- `POST /api/appointments/cancel`: Allows patients to cancel their upcoming booking.
- `POST /api/appointments/reschedule`: Allows patients to pick a new date and time slot.
- `GET /api/faqs`: Returns active FAQs.
- `GET /api/gallery`: Returns clinic tour items.

### Admin Protected Endpoints (Bearer Token Required)
- `POST /api/admin/login`: Staff authentication.
- `GET /api/admin/me`: Verifies active session token.
- `POST /api/admin/logout`: Invalidates session.
- `GET /api/admin/stats`: Overview dashboard metrics (today's bookings, pending, confirmed upcoming, completed).
- `GET /api/admin/appointments`: Filterable appointment table (search by patient, phone, status, or date).
- `PUT /api/admin/appointments/:id`: Update status (`confirmed`, `completed`, `cancelled`, `no-show`) or internal clinical notes.
- `DELETE /api/admin/appointments/:id`: Delete appointment record.
- `POST /api/admin/services` & `PUT /api/admin/services/:id`: Manage service catalog.
- `PUT /api/admin/working-hours`: Configure daily clinic schedule and slot durations.
- `PUT /api/admin/doctor`: Update Dr. Vinayak's verified qualifications and credentials.
- `PUT /api/admin/clinic-settings`: Update clinic address, WhatsApp, phone, and hero text.

---

## 5. Development & Testing Credentials

For local development and client evaluation:
- **Admin Portal**: Accessible via header or footer link ("Clinic Management Login")
- **Username**: `admin`
- **Password**: `VinayakAdmin2026!`

---

## 6. Running Locally

```bash
# Install dependencies
npm install

# Run full-stack dev server (starts Express + Vite on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
