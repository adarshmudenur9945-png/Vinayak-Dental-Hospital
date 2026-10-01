import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  initDatabase,
  queryAll,
  queryOne,
  execute,
  authenticateAdmin,
  verifyAdminSession,
  getClinicSettings,
  Appointment,
  Service,
  WorkingHour,
  DoctorProfile,
  FAQItem,
  GalleryItem
} from './src/server/db.ts';
import {
  syncAppointmentToSupabase,
  deleteAppointmentFromSupabase,
  fetchSupabaseAppointments,
  testSupabaseConnection,
  SUPABASE_SQL_SETUP,
  DEFAULT_SUPABASE_PROJECT_ID,
  DEFAULT_SUPABASE_URL
} from './src/server/supabase.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper middleware for Admin Auth
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const token = authHeader.split(' ')[1];
  if (!verifyAdminSession(token)) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
  next();
}

// Generate human-friendly unique appointment ID (e.g. VIN-2026-8941)
function generateAppointmentId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `VIN-${year}-${randomNum}`;
}

// Helper: Generate slots for a day
function generateDaySlots(openTime: string, closeTime: string, slotMinutes: number): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  let currentMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;

  while (currentMinutes + slotMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push(formatted);
    currentMinutes += slotMinutes;
  }
  return slots;
}

// -------------------------------------------------------------
// PUBLIC API ROUTES
// -------------------------------------------------------------

// 1. Clinic Settings & Profile
app.get('/api/clinic', (_req: Request, res: Response) => {
  try {
    const settings = getClinicSettings();
    const doctor = queryOne<DoctorProfile>("SELECT * FROM doctors LIMIT 1");
    const workingHours = queryAll<WorkingHour>("SELECT * FROM working_hours ORDER BY day_of_week ASC");
    res.json({
      settings,
      doctor,
      workingHours,
    });
  } catch (error) {
    console.error('Error fetching clinic info:', error);
    res.status(500).json({ error: 'Failed to retrieve clinic information' });
  }
});

// 2. Services List
app.get('/api/services', (_req: Request, res: Response) => {
  try {
    const services = queryAll<Service>("SELECT * FROM services WHERE is_active = 1 ORDER BY is_configured DESC, name ASC");
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
});

// 3. Availability for a given date
app.get('/api/availability', (req: Request, res: Response) => {
  try {
    const { date, service_id } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required' });
    }

    // Check date validity
    const requestedDate = new Date(`${date}T00:00:00`);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Day of week in JS: 0 = Sun, 1 = Mon ... 6 = Sat
    const dayOfWeek = requestedDate.getDay();
    const workingHour = queryOne<WorkingHour>(
      "SELECT * FROM working_hours WHERE day_of_week = ?",
      [dayOfWeek]
    );

    if (!workingHour || workingHour.is_open === 0) {
      return res.json({
        date,
        isOpen: false,
        reason: dayOfWeek === 0 ? 'Clinic is closed on Sundays' : 'Clinic is closed on this day',
        slots: []
      });
    }

    const slotDuration = workingHour.slot_duration_minutes || 30;
    const allSlots = generateDaySlots(workingHour.open_time, workingHour.close_time, slotDuration);

    // Fetch existing active bookings for this date
    const bookedAppointments = queryAll<{ appointment_time: string; status: string }>(
      "SELECT appointment_time, status FROM appointments WHERE appointment_date = ? AND status NOT IN ('cancelled')",
      [date]
    );

    const bookedSet = new Set(bookedAppointments.map(a => a.appointment_time));

    // Determine current time if date is today to disable past slots
    const today = new Date();
    const isToday = requestedDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];
    const currentHourMin = today.getHours() * 60 + today.getMinutes();

    const slots = allSlots.map(timeStr => {
      const [h, m] = timeStr.split(':').map(Number);
      const slotMin = h * 60 + m;
      const isPast = isToday && slotMin <= currentHourMin;
      const isBooked = bookedSet.has(timeStr);

      return {
        time: timeStr,
        available: !isBooked && !isPast,
        isBooked,
        isPast,
      };
    });

    res.json({
      date,
      isOpen: true,
      dayName: workingHour.day_name,
      workingHours: `${workingHour.open_time} - ${workingHour.close_time}`,
      slotDuration,
      slots
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to calculate availability' });
  }
});

// 4. Book Appointment (With Double-Booking Prevention, Validation & Auto-Sync to Supabase)
app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const {
      patient_name,
      phone,
      email,
      age,
      service_id,
      appointment_date,
      appointment_time,
      contact_method = 'phone',
      reason,
      consent_accepted
    } = req.body;

    if (!patient_name || !patient_name.trim()) {
      return res.status(400).json({ error: 'Patient full name is required' });
    }
    if (!phone || !phone.trim() || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    }
    if (!service_id) {
      return res.status(400).json({ error: 'Please select a dental service' });
    }
    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Appointment date and time slot are required' });
    }
    if (!consent_accepted) {
      return res.status(400).json({ error: 'Please accept the privacy and contact consent' });
    }

    // Verify service exists
    const service = queryOne<Service>("SELECT * FROM services WHERE id = ? AND is_active = 1", [service_id]);
    if (!service) {
      return res.status(400).json({ error: 'Selected service is invalid or unavailable' });
    }

    // Verify day is open
    const apptDate = new Date(`${appointment_date}T00:00:00`);
    if (isNaN(apptDate.getTime())) {
      return res.status(400).json({ error: 'Invalid appointment date format' });
    }
    const dayOfWeek = apptDate.getDay();
    const workingHour = queryOne<WorkingHour>("SELECT * FROM working_hours WHERE day_of_week = ?", [dayOfWeek]);
    if (!workingHour || workingHour.is_open === 0) {
      return res.status(400).json({ error: 'Clinic is closed on the selected date' });
    }

    // Default doctor
    const doctor = queryOne<DoctorProfile>("SELECT id FROM doctors LIMIT 1");
    const doctorId = doctor ? doctor.id : 'doc-vinayak';

    // SERVER-SIDE DOUBLE-BOOKING CHECK
    const existing = queryOne(
      "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('cancelled')",
      [doctorId, appointment_date, appointment_time]
    );

    if (existing) {
      return res.status(409).json({
        error: 'That time slot has just been booked by another patient. Please select another available time.'
      });
    }

    const appointmentCode = generateAppointmentId();
    const id = `apt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    execute(
      `INSERT INTO appointments (
        id, appointment_id, patient_name, phone, email, age, service_id, doctor_id,
        appointment_date, appointment_time, duration_minutes, status, contact_method, reason,
        supabase_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        appointmentCode,
        patient_name.trim(),
        phone.trim(),
        email ? email.trim() : null,
        age ? Number(age) : null,
        service_id,
        doctorId,
        appointment_date,
        appointment_time,
        service.duration_minutes || 30,
        'pending',
        contact_method,
        reason ? reason.trim() : null
      ]
    );

    const createdAppointment = queryOne<Appointment>(
      `SELECT a.*, s.name as service_name, s.price_display
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    // AUTOMATICALLY SAVE TO SUPABASE BACKEND
    let supabaseResult = { success: false, error: 'Not attempted' };
    try {
      if (createdAppointment) {
        const syncRes = await syncAppointmentToSupabase(createdAppointment, service.name);
        if (syncRes.success) {
          execute("UPDATE appointments SET supabase_synced = 1, supabase_error = NULL WHERE id = ?", [id]);
          createdAppointment.supabase_synced = 1;
          supabaseResult = { success: true, error: '' };
        } else {
          execute("UPDATE appointments SET supabase_synced = 0, supabase_error = ? WHERE id = ?", [syncRes.error || 'Sync failed', id]);
          createdAppointment.supabase_synced = 0;
          createdAppointment.supabase_error = syncRes.error;
          supabaseResult = { success: false, error: syncRes.error || 'Failed to sync to Supabase' };
        }
      }
    } catch (sbErr: any) {
      console.error('Supabase auto-sync failed:', sbErr);
      execute("UPDATE appointments SET supabase_synced = 0, supabase_error = ? WHERE id = ?", [sbErr.message, id]);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment request confirmed successfully',
      appointment: createdAppointment,
      supabase: supabaseResult
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    if (error?.message && error.message.includes('unique_slot_per_doctor')) {
      return res.status(409).json({
        error: 'That time slot has just been booked. Please select another available time.'
      });
    }
    res.status(500).json({ error: 'Failed to book appointment. Please try again or call the clinic.' });
  }
});

// 5. Patient Lookup / Track Appointment
app.get('/api/appointments/lookup', (req: Request, res: Response) => {
  try {
    const { code, phone } = req.query;
    if (!code && !phone) {
      return res.status(400).json({ error: 'Please provide either an Appointment ID or registered Phone Number' });
    }

    let appointments: any[] = [];
    if (code) {
      appointments = queryAll(
        `SELECT a.*, s.name as service_name, s.duration_minutes, s.price_display
         FROM appointments a
         LEFT JOIN services s ON a.service_id = s.id
         WHERE UPPER(a.appointment_id) = UPPER(?)
         ORDER BY a.created_at DESC`,
        [String(code).trim()]
      );
    } else if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      appointments = queryAll(
        `SELECT a.*, s.name as service_name, s.duration_minutes, s.price_display
         FROM appointments a
         LEFT JOIN services s ON a.service_id = s.id
         WHERE REPLACE(REPLACE(a.phone, ' ', ''), '+', '') LIKE ?
         ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
        [`%${cleanPhone.slice(-10)}%`]
      );
    }

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup appointment' });
  }
});

// 6. Patient Cancel Appointment
app.post('/api/appointments/cancel', async (req: Request, res: Response) => {
  try {
    const { appointment_id, reason } = req.body;
    if (!appointment_id) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    const appt = queryOne<Appointment>("SELECT * FROM appointments WHERE appointment_id = ?", [appointment_id]);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appt.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    execute(
      "UPDATE appointments SET status = 'cancelled', admin_notes = COALESCE(admin_notes || ' | ', '') || ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [`Cancelled by patient. Reason: ${reason || 'Not specified'}`, appt.id]
    );

    const updated = queryOne<Appointment>(
      "SELECT a.*, s.name as service_name FROM appointments a LEFT JOIN services s ON a.service_id = s.id WHERE a.id = ?",
      [appt.id]
    );
    if (updated) {
      syncAppointmentToSupabase(updated, updated.service_name).catch(console.error);
    }

    res.json({ success: true, message: 'Appointment has been cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// 7. Patient Reschedule Appointment
app.post('/api/appointments/reschedule', async (req: Request, res: Response) => {
  try {
    const { appointment_id, new_date, new_time } = req.body;
    if (!appointment_id || !new_date || !new_time) {
      return res.status(400).json({ error: 'Appointment ID, new date, and new time slot are required' });
    }

    const appt = queryOne<Appointment>("SELECT * FROM appointments WHERE appointment_id = ?", [appointment_id]);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if new slot is taken
    const existing = queryOne(
      "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND id != ? AND status NOT IN ('cancelled')",
      [appt.doctor_id, new_date, new_time, appt.id]
    );

    if (existing) {
      return res.status(409).json({ error: 'The requested new slot is not available. Please pick another time.' });
    }

    execute(
      "UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [new_date, new_time, appt.id]
    );

    const updated = queryOne<Appointment>(
      "SELECT a.*, s.name as service_name FROM appointments a LEFT JOIN services s ON a.service_id = s.id WHERE a.id = ?",
      [appt.id]
    );
    if (updated) {
      syncAppointmentToSupabase(updated, updated.service_name).catch(console.error);
    }

    res.json({ success: true, message: 'Appointment rescheduled successfully.', appointment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// 8. Public FAQs
app.get('/api/faqs', (_req: Request, res: Response) => {
  try {
    const faqs = queryAll<FAQItem>("SELECT * FROM faqs WHERE is_active = 1 ORDER BY display_order ASC");
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve FAQs' });
  }
});

// 9. Public Gallery
app.get('/api/gallery', (_req: Request, res: Response) => {
  try {
    const items = queryAll<GalleryItem>("SELECT * FROM gallery ORDER BY display_order ASC");
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve gallery items' });
  }
});

// -------------------------------------------------------------
// ADMIN AUTHENTICATION
// -------------------------------------------------------------

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const result = authenticateAdmin(username.trim(), password);
  if (!result.success) {
    return res.status(401).json({ error: result.error || 'Authentication failed' });
  }

  res.json({
    success: true,
    token: result.token,
    user: { username }
  });
});

app.get('/api/admin/me', requireAdmin, (_req: Request, res: Response) => {
  res.json({ authenticated: true, user: { role: 'admin', clinic: 'DR. VINAYAK DENTAL CLINIC' } });
});

app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    execute("UPDATE admin_users SET session_token = NULL WHERE session_token = ?", [token]);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// ADMIN PROTECTED DASHBOARD ROUTES
// -------------------------------------------------------------

// Admin Dashboard Overview Stats
app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayCount = queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status != 'cancelled'",
      [today]
    )?.count || 0;

    const pendingCount = queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'"
    )?.count || 0;

    const confirmedUpcoming = queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed' AND appointment_date >= ?",
      [today]
    )?.count || 0;

    const completedTotal = queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'"
    )?.count || 0;

    const cancelledTotal = queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'"
    )?.count || 0;

    res.json({
      todayCount,
      pendingCount,
      confirmedUpcoming,
      completedTotal,
      cancelledTotal
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute dashboard stats' });
  }
});

// Admin All Appointments (with filters)
app.get('/api/admin/appointments', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status, date, search } = req.query;
    let sql = `
      SELECT a.*, s.name as service_name, s.duration_minutes
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += " AND a.status = ?";
      params.push(status);
    }
    if (date) {
      sql += " AND a.appointment_date = ?";
      params.push(date);
    }
    if (search && typeof search === 'string') {
      sql += " AND (a.patient_name LIKE ? OR a.phone LIKE ? OR a.appointment_id LIKE ?)";
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    sql += " ORDER BY a.appointment_date DESC, a.appointment_time ASC";

    const appointments = queryAll(sql, params);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

// Admin Create Appointment (Direct Walk-in / Phone-in booking by clinic receptionist)
app.post('/api/admin/appointments', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      patient_name,
      phone,
      email,
      age,
      service_id,
      appointment_date,
      appointment_time,
      contact_method = 'phone',
      reason,
      admin_notes,
      status = 'confirmed'
    } = req.body;

    if (!patient_name || !patient_name.trim()) {
      return res.status(400).json({ error: 'Patient full name is required' });
    }
    if (!phone || !phone.trim() || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    }
    if (!service_id) {
      return res.status(400).json({ error: 'Dental service must be selected' });
    }
    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Appointment date and time are required' });
    }

    const service = queryOne<Service>("SELECT * FROM services WHERE id = ?", [service_id]);
    const doctor = queryOne<DoctorProfile>("SELECT id FROM doctors LIMIT 1");
    const doctorId = doctor ? doctor.id : 'doc-vinayak';

    // Conflict check
    if (status !== 'cancelled') {
      const collision = queryOne(
        "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'",
        [doctorId, appointment_date, appointment_time]
      );
      if (collision) {
        return res.status(409).json({ error: 'Selected time slot is already booked for another patient.' });
      }
    }

    const appointmentCode = `VIN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `apt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    execute(
      `INSERT INTO appointments (
        id, appointment_id, patient_name, phone, email, age, service_id, doctor_id,
        appointment_date, appointment_time, duration_minutes, status, contact_method, reason,
        admin_notes, supabase_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        appointmentCode,
        patient_name.trim(),
        phone.trim(),
        email ? email.trim() : null,
        age ? Number(age) : null,
        service_id,
        doctorId,
        appointment_date,
        appointment_time,
        service ? service.duration_minutes : 30,
        status,
        contact_method,
        reason ? reason.trim() : null,
        admin_notes ? admin_notes.trim() : 'Booked via Admin Desk'
      ]
    );

    const created = queryOne<Appointment>(
      `SELECT a.*, s.name as service_name, s.price_display
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    if (created) {
      const syncRes = await syncAppointmentToSupabase(created, created.service_name);
      if (syncRes.success) {
        execute("UPDATE appointments SET supabase_synced = 1, supabase_error = NULL WHERE id = ?", [id]);
        created.supabase_synced = 1;
      } else {
        execute("UPDATE appointments SET supabase_synced = 0, supabase_error = ? WHERE id = ?", [syncRes.error || 'Sync failed', id]);
      }
    }

    res.status(201).json({ success: true, appointment: created });
  } catch (error: any) {
    console.error('Error creating admin appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to create appointment' });
  }
});

// Admin Update / Full Edit Appointment (all fields, reschedule, status, clinical notes)
app.put('/api/admin/appointments/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      patient_name,
      phone,
      email,
      age,
      service_id,
      appointment_date,
      appointment_time,
      status,
      contact_method,
      reason,
      admin_notes
    } = req.body;

    const appt = queryOne<Appointment>("SELECT * FROM appointments WHERE id = ?", [id]);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const nextDate = appointment_date || appt.appointment_date;
    const nextTime = appointment_time || appt.appointment_time;
    const nextStatus = status || appt.status;
    const nextServiceId = service_id || appt.service_id;
    const nextName = patient_name !== undefined ? patient_name.trim() : appt.patient_name;
    const nextPhone = phone !== undefined ? phone.trim() : appt.phone;
    const nextEmail = email !== undefined ? (email ? email.trim() : null) : appt.email;
    const nextAge = age !== undefined ? (age ? Number(age) : null) : appt.age;
    const nextContact = contact_method || appt.contact_method;
    const nextReason = reason !== undefined ? (reason ? reason.trim() : null) : appt.reason;
    const nextNotes = admin_notes !== undefined ? admin_notes : appt.admin_notes;

    // If changing time or date, verify collision
    if (nextStatus !== 'cancelled' && (nextDate !== appt.appointment_date || nextTime !== appt.appointment_time)) {
      const collision = queryOne(
        "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND id != ? AND status != 'cancelled'",
        [appt.doctor_id, nextDate, nextTime, id]
      );
      if (collision) {
        return res.status(409).json({ error: 'Selected date and time is already booked for another patient.' });
      }
    }

    // Fetch service duration if service changed
    let duration = appt.duration_minutes;
    if (nextServiceId !== appt.service_id) {
      const srv = queryOne<Service>("SELECT duration_minutes FROM services WHERE id = ?", [nextServiceId]);
      if (srv) duration = srv.duration_minutes;
    }

    execute(
      `UPDATE appointments
       SET patient_name = ?,
           phone = ?,
           email = ?,
           age = ?,
           service_id = ?,
           appointment_date = ?,
           appointment_time = ?,
           duration_minutes = ?,
           status = ?,
           contact_method = ?,
           reason = ?,
           admin_notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nextName,
        nextPhone,
        nextEmail,
        nextAge,
        nextServiceId,
        nextDate,
        nextTime,
        duration,
        nextStatus,
        nextContact,
        nextReason,
        nextNotes,
        id
      ]
    );

    const updated = queryOne<Appointment>(
      `SELECT a.*, s.name as service_name, s.price_display
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    if (updated) {
      // Sync update to Supabase
      const syncRes = await syncAppointmentToSupabase(updated, updated.service_name);
      if (syncRes.success) {
        execute("UPDATE appointments SET supabase_synced = 1, supabase_error = NULL WHERE id = ?", [id]);
        updated.supabase_synced = 1;
      } else {
        execute("UPDATE appointments SET supabase_synced = 0, supabase_error = ? WHERE id = ?", [syncRes.error || 'Sync failed', id]);
        updated.supabase_synced = 0;
        updated.supabase_error = syncRes.error;
      }
    }

    res.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to update appointment' });
  }
});

// Admin Cancel Appointment (Explicit Cancel with reason)
app.post('/api/admin/appointments/:id/cancel', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by Clinic Staff' } = req.body;

    const appt = queryOne<Appointment>("SELECT * FROM appointments WHERE id = ?", [id]);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const noteAppend = `[Cancelled]: ${reason}`;
    const newNotes = appt.admin_notes ? `${appt.admin_notes} | ${noteAppend}` : noteAppend;

    execute(
      "UPDATE appointments SET status = 'cancelled', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newNotes, id]
    );

    const updated = queryOne<Appointment>(
      `SELECT a.*, s.name as service_name, s.price_display
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    if (updated) {
      await syncAppointmentToSupabase(updated, updated.service_name);
    }

    res.json({ success: true, message: 'Appointment cancelled successfully', appointment: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel appointment' });
  }
});

// Admin Delete Appointment (Permanently remove from local SQLite and Supabase)
app.delete('/api/admin/appointments/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appt = queryOne<Appointment>("SELECT * FROM appointments WHERE id = ?", [id]);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Delete from Supabase
    if (appt.appointment_id) {
      await deleteAppointmentFromSupabase(appt.appointment_id);
    }

    // Delete from local SQLite
    execute("DELETE FROM appointments WHERE id = ?", [id]);

    res.json({ success: true, message: `Appointment ${appt.appointment_id} deleted permanently` });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to delete appointment' });
  }
});

// Admin Supabase Direct Fetch (retrieves raw records from Supabase database)
app.get('/api/admin/supabase-appointments', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await fetchSupabaseAppointments();
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to query Supabase' });
    }
    res.json(result.data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to query Supabase' });
  }
});

// Admin Supabase Integration Status & Diagnostics
app.get('/api/admin/supabase-status', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const status = await testSupabaseConnection();
    const syncedCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM appointments WHERE supabase_synced = 1")?.count || 0;
    const unsyncedCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM appointments WHERE supabase_synced = 0 OR supabase_synced IS NULL")?.count || 0;
    const totalCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM appointments")?.count || 0;

    res.json({
      ...status,
      syncedCount,
      unsyncedCount,
      totalCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to check Supabase status' });
  }
});

// Admin Supabase Sync All (batch push unsynced appointments into Supabase)
app.post('/api/admin/supabase-sync-all', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const allAppointments = queryAll<Appointment>(
      "SELECT a.*, s.name as service_name FROM appointments a LEFT JOIN services s ON a.service_id = s.id"
    );

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const appt of allAppointments) {
      const resSync = await syncAppointmentToSupabase(appt, appt.service_name);
      if (resSync.success) {
        execute("UPDATE appointments SET supabase_synced = 1, supabase_error = NULL WHERE id = ?", [appt.id]);
        syncedCount++;
      } else {
        execute("UPDATE appointments SET supabase_synced = 0, supabase_error = ? WHERE id = ?", [resSync.error || 'Failed', appt.id]);
        failedCount++;
        if (resSync.error && !errors.includes(resSync.error)) {
          errors.push(resSync.error);
        }
      }
    }

    res.json({
      success: true,
      total: allAppointments.length,
      syncedCount,
      failedCount,
      errors
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to trigger Supabase sync' });
  }
});

// Admin Delete Appointment
app.delete('/api/admin/appointments/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    execute("DELETE FROM appointments WHERE id = ?", [id]);
    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Admin Services CRUD
app.post('/api/admin/services', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      description,
      duration_minutes = 30,
      price_display = 'Consultation Based',
      is_active = 1,
      is_configured = 1,
      details_treatment = '',
      details_suitability = '',
      details_prep = '',
      details_aftercare = ''
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Service name and description are required' });
    }

    const id = `srv-${Date.now()}`;
    execute(
      `INSERT INTO services (
        id, name, category, description, duration_minutes, price_display, is_active, is_configured,
        details_treatment, details_suitability, details_prep, details_aftercare
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, category || 'General Dental', description, duration_minutes, price_display, is_active, is_configured, details_treatment, details_suitability, details_prep, details_aftercare]
    );

    const created = queryOne<Service>("SELECT * FROM services WHERE id = ?", [id]);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/admin/services/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      duration_minutes,
      price_display,
      is_active,
      is_configured,
      details_treatment,
      details_suitability,
      details_prep,
      details_aftercare
    } = req.body;

    execute(
      `UPDATE services
       SET name = ?, category = ?, description = ?, duration_minutes = ?, price_display = ?,
           is_active = ?, is_configured = ?, details_treatment = ?, details_suitability = ?,
           details_prep = ?, details_aftercare = ?
       WHERE id = ?`,
      [name, category, description, duration_minutes, price_display, is_active, is_configured, details_treatment, details_suitability, details_prep, details_aftercare, id]
    );

    const updated = queryOne<Service>("SELECT * FROM services WHERE id = ?", [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/admin/services/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    execute("DELETE FROM services WHERE id = ?", [id]);
    res.json({ success: true, message: 'Service removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Admin Working Hours Update
app.put('/api/admin/working-hours', requireAdmin, (req: Request, res: Response) => {
  try {
    const { hours } = req.body;
    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'Hours array required' });
    }

    for (const h of hours) {
      execute(
        `UPDATE working_hours
         SET is_open = ?, open_time = ?, close_time = ?, slot_duration_minutes = ?
         WHERE day_of_week = ?`,
        [h.is_open ? 1 : 0, h.open_time, h.close_time, h.slot_duration_minutes || 30, h.day_of_week]
      );
    }

    const updated = queryAll<WorkingHour>("SELECT * FROM working_hours ORDER BY day_of_week ASC");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update working hours' });
  }
});

// Admin Doctor Profile Update
app.put('/api/admin/doctor', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      name,
      qualification,
      specialization,
      experience_years,
      registration_number,
      languages,
      biography,
      photo_url,
      is_configured = 1
    } = req.body;

    execute(
      `UPDATE doctors
       SET name = ?, qualification = ?, specialization = ?, experience_years = ?,
           registration_number = ?, languages = ?, biography = ?, photo_url = ?,
           is_configured = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = 'doc-vinayak'`,
      [name, qualification, specialization, experience_years, registration_number, languages, biography, photo_url, is_configured ? 1 : 0]
    );

    const doc = queryOne<DoctorProfile>("SELECT * FROM doctors WHERE id = 'doc-vinayak'");
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
});

// Admin Clinic Settings Update
app.put('/api/admin/clinic-settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    for (const [key, value] of Object.entries(settings)) {
      execute(
        `INSERT INTO clinic_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }

    const updatedSettings = getClinicSettings();
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update clinic settings' });
  }
});

// Admin FAQ CRUD
app.post('/api/admin/faqs', requireAdmin, (req: Request, res: Response) => {
  try {
    const { question, answer, display_order = 0 } = req.body;
    const id = `faq-${Date.now()}`;
    execute("INSERT INTO faqs (id, question, answer, display_order, is_active) VALUES (?, ?, ?, ?, 1)", [id, question, answer, display_order]);
    res.json({ id, question, answer, display_order, is_active: 1 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

app.put('/api/admin/faqs/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, answer, display_order, is_active } = req.body;
    execute("UPDATE faqs SET question = ?, answer = ?, display_order = ?, is_active = ? WHERE id = ?", [question, answer, display_order, is_active, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

app.delete('/api/admin/faqs/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    execute("DELETE FROM faqs WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// Admin Gallery CRUD
app.post('/api/admin/gallery', requireAdmin, (req: Request, res: Response) => {
  try {
    const { title, category, image_url, caption, is_verified = 1, display_order = 0 } = req.body;
    const id = `gal-${Date.now()}`;
    execute(
      "INSERT INTO gallery (id, title, category, image_url, caption, is_verified, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, title, category, image_url, caption, is_verified ? 1 : 0, display_order]
    );
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add gallery image' });
  }
});

app.delete('/api/admin/gallery/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    execute("DELETE FROM gallery WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

// -------------------------------------------------------------
// VITE INTEGRATION & SERVER STARTUP
// -------------------------------------------------------------

async function startServer() {
  await initDatabase();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot failure:', err);
  process.exit(1);
});
