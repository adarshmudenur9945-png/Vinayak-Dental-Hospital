import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project configuration provided by user
export const DEFAULT_SUPABASE_PROJECT_ID = 'rchbbdrpilabsspcmtks';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_UX3cr_jx32rCcyDOXSkGNA_baw3uk86';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient {
  const url = customUrl || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = customKey || process.env.SUPABASE_KEY || DEFAULT_SUPABASE_KEY;

  if (!supabaseClient || customUrl || customKey) {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
}

export const SUPABASE_SQL_SETUP = `-- Supabase SQL Setup for Dr. Vinayak Dental Clinic
-- Copy and run this in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  appointment_id TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  service_id TEXT,
  service_name TEXT,
  doctor_id TEXT DEFAULT 'doc-vinayak',
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending',
  contact_method TEXT DEFAULT 'phone',
  reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_supabase_appt_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_supabase_appt_phone ON public.appointments(phone);
CREATE INDEX IF NOT EXISTS idx_supabase_appt_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_supabase_appt_code ON public.appointments(appointment_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access using your publishable/anon key
DROP POLICY IF EXISTS "Allow public insert" ON public.appointments;
CREATE POLICY "Allow public insert" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select" ON public.appointments;
CREATE POLICY "Allow public select" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update" ON public.appointments;
CREATE POLICY "Allow public update" ON public.appointments FOR UPDATE USING (true);
`;

export interface SupabaseSyncResult {
  success: boolean;
  error?: string;
  code?: string;
  data?: any;
}

export async function syncAppointmentToSupabase(
  appointment: any,
  serviceName?: string
): Promise<SupabaseSyncResult> {
  try {
    const supabase = getSupabaseClient();

    const payload = {
      id: appointment.id,
      appointment_id: appointment.appointment_id,
      patient_name: appointment.patient_name,
      phone: appointment.phone,
      email: appointment.email || null,
      age: appointment.age ? Number(appointment.age) : null,
      service_id: appointment.service_id,
      service_name: serviceName || appointment.service_name || 'General Dental Consultation',
      doctor_id: appointment.doctor_id || 'doc-vinayak',
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes || 30,
      status: appointment.status || 'pending',
      contact_method: appointment.contact_method || 'phone',
      reason: appointment.reason || null,
      admin_notes: appointment.admin_notes || null,
      created_at: appointment.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`[Supabase] Syncing appointment ${appointment.appointment_id} to Supabase...`);

    const { data, error } = await supabase
      .from('appointments')
      .upsert(payload, { onConflict: 'appointment_id' })
      .select();

    if (error) {
      console.error('[Supabase Sync Error]:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    console.log(`[Supabase] Successfully saved appointment ${appointment.appointment_id} to Supabase!`);
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    console.error('[Supabase Sync Exception]:', err);
    return {
      success: false,
      error: err.message || 'Unknown Supabase sync error',
    };
  }
}

export async function deleteAppointmentFromSupabase(appointmentId: string): Promise<SupabaseSyncResult> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('appointments')
      .delete()
      .eq('appointment_id', appointmentId);

    if (error) {
      console.error('[Supabase Delete Error]:', error);
      return { success: false, error: error.message };
    }
    console.log(`[Supabase] Deleted appointment ${appointmentId} from Supabase`);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase Delete Exception]:', err);
    return { success: false, error: err.message };
  }
}

export async function fetchSupabaseAppointments(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tableReady: boolean;
  projectId: string;
  url: string;
  error?: string;
  code?: string;
  sqlSetup: string;
}> {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const projectId = DEFAULT_SUPABASE_PROJECT_ID;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('appointments').select('id').limit(1);

    if (error) {
      // Code PGRST205: table doesn't exist yet
      if (error.code === 'PGRST205' || error.message.includes('schema cache') || error.message.includes('not find')) {
        return {
          connected: true,
          tableReady: false,
          projectId,
          url,
          error: "Connected to Supabase successfully, but the 'appointments' table has not been created yet in your Supabase database.",
          code: error.code,
          sqlSetup: SUPABASE_SQL_SETUP,
        };
      }

      return {
        connected: false,
        tableReady: false,
        projectId,
        url,
        error: error.message,
        code: error.code,
        sqlSetup: SUPABASE_SQL_SETUP,
      };
    }

    return {
      connected: true,
      tableReady: true,
      projectId,
      url,
      sqlSetup: SUPABASE_SQL_SETUP,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableReady: false,
      projectId,
      url,
      error: err.message || 'Failed to connect to Supabase',
      sqlSetup: SUPABASE_SQL_SETUP,
    };
  }
}
