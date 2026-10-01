import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  LogOut,
  Calendar,
  Users,
  Clock,
  Settings,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  FileText,
  UserCheck,
  Save,
  HelpCircle,
  Image as ImageIcon,
  Database,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Server,
  Eye,
  Ban,
  Download,
  Printer,
  Mail,
  User,
  Stethoscope,
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Share2
} from 'lucide-react';
import {
  Appointment,
  Service,
  WorkingHour,
  DoctorProfile,
  ClinicSettings,
  FAQItem,
  GalleryItem
} from '../../types';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  // Authentication State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vinayak_admin_token'));
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab: 'overview' | 'appointments' | 'calendar' | 'services' | 'hours' | 'doctor' | 'settings' | 'faqs' | 'gallery'
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Filters for Appointments
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [loadingAppts, setLoadingAppts] = useState<boolean>(false);

  // Modals inside Admin
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingService, setIsAddingService] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isAddingAppointment, setIsAddingAppointment] = useState<boolean>(false);
  const [selectedViewAppointment, setSelectedViewAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Patient requested cancellation');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [quickDatePreset, setQuickDatePreset] = useState<string>('all');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New Appointment Form Initial State
  const [newApptData, setNewApptData] = useState({
    patient_name: '',
    phone: '',
    email: '',
    age: '',
    service_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00',
    status: 'confirmed',
    contact_method: 'phone',
    reason: '',
    admin_notes: 'Booked via Admin Front-Desk',
  });

  // Calendar View Mode: 'day' | 'week'
  const [calendarDate, setCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Supabase Integration States
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [loadingSupabase, setLoadingSupabase] = useState<boolean>(false);
  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  const fetchSupabaseStatus = async () => {
    if (!token) return;
    setLoadingSupabase(true);
    try {
      const res = await fetch('/api/admin/supabase-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSupabaseStatus(await res.json());
      }
    } catch (err) {
      console.error('Error checking Supabase status:', err);
    } finally {
      setLoadingSupabase(false);
    }
  };

  const handleSyncAllSupabase = async () => {
    if (!token) return;
    setSyncingAll(true);
    try {
      const res = await fetch('/api/admin/supabase-sync-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        flashSuccess(`Supabase sync complete: ${data.syncedCount} synced, ${data.failedCount} pending/errors.`);
        fetchSupabaseStatus();
        fetchAppointments();
      } else {
        alert(data.error || 'Failed to sync to Supabase');
      }
    } catch (err: any) {
      alert(err.message || 'Error triggering Supabase sync');
    } finally {
      setSyncingAll(false);
    }
  };

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      // Appointments
      fetchAppointments();

      // Services
      const srvRes = await fetch('/api/services');
      if (srvRes.ok) setServices(await srvRes.json());

      // Clinic info
      const clinicRes = await fetch('/api/clinic');
      if (clinicRes.ok) {
        const cData = await clinicRes.json();
        setSettings(cData.settings);
        setDoctor(cData.doctor);
        setWorkingHours(cData.workingHours);
      }

      // FAQs & Gallery
      const faqRes = await fetch('/api/faqs');
      if (faqRes.ok) setFaqs(await faqRes.json());

      const galRes = await fetch('/api/gallery');
      if (galRes.ok) setGallery(await galRes.json());

      // Supabase connection & sync status
      fetchSupabaseStatus();
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const fetchAppointments = async () => {
    if (!token) return;
    try {
      setLoadingAppts(true);
      let url = '/api/admin/appointments?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterDate) url += `date=${filterDate}&`;
      if (filterSearch) url += `search=${encodeURIComponent(filterSearch)}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [filterStatus, filterDate, filterSearch, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      localStorage.setItem('vinayak_admin_token', data.token);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('vinayak_admin_token');
    setToken(null);
  };

  // Appointment Status Updater
  const updateAppointmentStatus = async (id: string, status: string, notes?: string | null) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, admin_notes: notes }),
      });
      if (res.ok) {
        flashSuccess(`Appointment status marked as ${status}`);
        fetchAppointments();
        fetchAdminData();
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Full Edit Appointment Submit
  const handleSaveAppointmentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingAppointment) return;
    setActionLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingAppointment)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save appointment changes');
      }
      flashSuccess('Appointment updated and synced to database');
      setEditingAppointment(null);
      if (selectedViewAppointment?.id === editingAppointment.id) {
        setSelectedViewAppointment(data.appointment);
      }
      fetchAppointments();
      fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      setFormError(err.message || 'Error updating appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Walk-In / Phone-In Appointment Creation by Staff
  const handleCreateAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setFormError(null);
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newApptData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }
      flashSuccess(`Appointment ${data.appointment?.appointment_id || ''} created & saved`);
      setIsAddingAppointment(false);
      setNewApptData({
        patient_name: '',
        phone: '',
        email: '',
        age: '',
        service_id: services[0]?.id || '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:00',
        status: 'confirmed',
        contact_method: 'phone',
        reason: '',
        admin_notes: 'Booked via Admin Front-Desk',
      });
      fetchAppointments();
      fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      setFormError(err.message || 'Error creating appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Explicit Cancellation Confirmation
  const handleConfirmCancel = async () => {
    if (!token || !cancellingAppointment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/appointments/${cancellingAppointment.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel appointment');
      }
      flashSuccess(`Appointment ${cancellingAppointment.appointment_id} cancelled & slot released`);
      setCancellingAppointment(null);
      if (selectedViewAppointment?.id === cancellingAppointment.id) {
        setSelectedViewAppointment(null);
      }
      fetchAppointments();
      fetchAdminData();
      onDataChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Permanent Delete
  const deleteAppointment = async (id: string, apptCode?: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete appointment ${apptCode || ''}? This removes the record from both local database and Supabase.`)) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        flashSuccess('Appointment deleted permanently');
        if (selectedViewAppointment?.id === id) {
          setSelectedViewAppointment(null);
        }
        fetchAppointments();
        fetchAdminData();
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!appointments || appointments.length === 0) {
      alert('No appointments available to export');
      return;
    }
    const headers = [
      'Appointment ID',
      'Patient Name',
      'Phone',
      'Email',
      'Age',
      'Service',
      'Date',
      'Time',
      'Duration (min)',
      'Status',
      'Contact Method',
      'Reason',
      'Admin Notes',
      'Supabase Synced',
      'Created At'
    ];
    const rows = appointments.map(a => [
      `"${a.appointment_id || ''}"`,
      `"${(a.patient_name || '').replace(/"/g, '""')}"`,
      `"${a.phone || ''}"`,
      `"${a.email || ''}"`,
      `"${a.age || ''}"`,
      `"${(a.service_name || '').replace(/"/g, '""')}"`,
      `"${a.appointment_date || ''}"`,
      `"${a.appointment_time || ''}"`,
      `"${a.duration_minutes || 30}"`,
      `"${a.status || ''}"`,
      `"${a.contact_method || ''}"`,
      `"${(a.reason || '').replace(/"/g, '""')}"`,
      `"${(a.admin_notes || '').replace(/"/g, '""')}"`,
      `"${a.supabase_synced ? 'YES' : 'NO'}"`,
      `"${a.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vinayak_appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Schedule
  const handlePrintSchedule = () => {
    window.print();
  };

  // Service Save / Delete
  const handleSaveService = async (serviceData: Partial<Service>) => {
    if (!token) return;
    try {
      const isEdit = !!serviceData.id && !isAddingService;
      const url = isEdit ? `/api/admin/services/${serviceData.id}` : '/api/admin/services';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serviceData),
      });

      if (res.ok) {
        flashSuccess('Service catalog updated successfully');
        setEditingService(null);
        setIsAddingService(false);
        const srvRes = await fetch('/api/services');
        if (srvRes.ok) setServices(await srvRes.json());
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Delete this service from clinic catalog?')) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        flashSuccess('Service deleted');
        const srvRes = await fetch('/api/services');
        if (srvRes.ok) setServices(await srvRes.json());
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Working Hours Save
  const handleSaveWorkingHours = async () => {
    if (!token || !workingHours) return;
    try {
      const res = await fetch('/api/admin/working-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hours: workingHours }),
      });
      if (res.ok) {
        flashSuccess('Working hours updated successfully');
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Doctor Profile Save
  const handleSaveDoctor = async () => {
    if (!token || !doctor) return;
    try {
      const res = await fetch('/api/admin/doctor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(doctor),
      });
      if (res.ok) {
        flashSuccess('Doctor credentials & profile updated');
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clinic Settings Save
  const handleSaveSettings = async () => {
    if (!token || !settings) return;
    try {
      const res = await fetch('/api/admin/clinic-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        flashSuccess('Clinic details and configuration saved');
        onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const flashSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    >
      <div className="relative bg-white rounded-2xl max-w-6xl w-full h-[94vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        
        {/* Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base leading-tight">
                Clinic Management Portal
              </h2>
              <p className="text-[11px] text-teal-200/80">
                DR. VINAYAK DENTAL CLINIC · Yargatti
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast notification */}
        {saveSuccessMsg && (
          <div className="bg-emerald-500 text-white text-xs px-4 py-2 text-center font-semibold flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Not Logged In -> Show Login Form */}
        {!token ? (
          <div className="flex-1 p-6 flex items-center justify-center bg-slate-50">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md max-w-md w-full space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-teal-700" />
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900">
                  Staff Authentication
                </h3>
                <p className="text-xs text-slate-500">
                  Sign in to manage appointments, services, and clinic settings.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{loginError}</div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-teal-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
                >
                  {loginLoading ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </form>

              <div className="pt-2 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400">
                  Authorized clinic administrators and staff only.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Logged In Dashboard Layout */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
            
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-56 bg-slate-900 text-slate-300 flex flex-row md:flex-col shrink-0 border-r border-slate-800 overflow-x-auto md:overflow-y-auto">
              <div className="p-2 md:p-3 space-y-1 w-full flex md:flex-col gap-1">
                {[
                  { id: 'overview', label: 'Overview', icon: ShieldCheck },
                  { id: 'appointments', label: 'Appointments', icon: Calendar },
                  { id: 'services', label: 'Services Catalog', icon: FileText },
                  { id: 'hours', label: 'Working Hours', icon: Clock },
                  { id: 'doctor', label: 'Doctor Profile', icon: UserCheck },
                  { id: 'settings', label: 'Clinic Information', icon: Settings },
                  { id: 'supabase', label: 'Supabase Database', icon: Database },
                  { id: 'faqs', label: 'FAQs & Content', icon: HelpCircle },
                  { id: 'gallery', label: 'Clinic Photos', icon: ImageIcon },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        activeTab === t.id
                          ? 'bg-teal-700 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      Dashboard Summary
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time appointment metrics for Dr. Vinayak Dental Clinic
                    </p>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Today's Appointments</span>
                      <span className="font-mono text-2xl font-bold text-slate-900 mt-1 block">
                        {stats?.todayCount ?? 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-amber-200 bg-amber-50/30 shadow-2xs">
                      <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Pending Requests</span>
                      <span className="font-mono text-2xl font-bold text-amber-800 mt-1 block">
                        {stats?.pendingCount ?? 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-emerald-200 bg-emerald-50/30 shadow-2xs">
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Confirmed Upcoming</span>
                      <span className="font-mono text-2xl font-bold text-emerald-800 mt-1 block">
                        {stats?.confirmedUpcoming ?? 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Completed</span>
                      <span className="font-mono text-2xl font-bold text-slate-700 mt-1 block">
                        {stats?.completedTotal ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Quick Operations
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                      >
                        View All Appointments →
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingService(true);
                          setEditingService({
                            id: '',
                            name: '',
                            category: 'General Dental',
                            description: '',
                            duration_minutes: 30,
                            price_display: 'Consultation based',
                            is_active: 1,
                            is_configured: 1,
                          });
                          setActiveTab('services');
                        }}
                        className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50"
                      >
                        + Add New Dental Service
                      </button>
                      <button
                        onClick={() => setActiveTab('hours')}
                        className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50"
                      >
                        Configure Working Hours
                      </button>
                    </div>
                  </div>

                  {/* Clinic Coordinates Summary */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                      Practice Verification Reference
                    </h4>
                    <p>
                      <strong>Business:</strong> DR. VINAYAK DENTAL CLINIC · Ganagi Complex, 1st Floor, Market Road, Near KSRTC Bus Stand, Yargatti, Karnataka 591129
                    </p>
                    <p>
                      <strong>Direct Contact:</strong> +91 82960 74230 (Calls & WhatsApp)
                    </p>
                    <p>
                      <strong>Consultation Hours:</strong> Monday through Saturday, 9:00 AM – 8:00 PM (Closed Sundays)
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: APPOINTMENTS MANAGEMENT */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  {/* Top Bar with Title & Action Buttons */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-xl text-slate-900">
                          Appointment Management
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {appointments.length} Total
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        View, search, edit, reschedule, or cancel patient bookings with instant database updates.
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-2xs"
                        title="Download appointments list as CSV"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintSchedule}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-2xs"
                        title="Print appointment schedule"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewApptData({
                            patient_name: '',
                            phone: '',
                            email: '',
                            age: '',
                            service_id: services[0]?.id || '',
                            appointment_date: new Date().toISOString().split('T')[0],
                            appointment_time: '10:00',
                            status: 'confirmed',
                            contact_method: 'phone',
                            reason: '',
                            admin_notes: 'Booked via Admin Front-Desk',
                          });
                          setFormError(null);
                          setIsAddingAppointment(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        <span>+ New Booking</span>
                      </button>
                    </div>
                  </div>

                  {/* KPI Quick Filter Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFilterStatus('all')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        filterStatus === 'all'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${filterStatus === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                        All Bookings
                      </span>
                      <div className="font-display font-bold text-xl mt-0.5">
                        {stats ? (stats.pendingCount + stats.confirmedUpcoming + stats.completedTotal + stats.cancelledTotal) : appointments.length}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterStatus('pending')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        filterStatus === 'pending'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-800 border-amber-200 hover:border-amber-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider block ${filterStatus === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>
                          Pending
                        </span>
                        {(stats?.pendingCount || 0) > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                      <div className="font-display font-bold text-xl mt-0.5 text-amber-900">
                        <span className={filterStatus === 'pending' ? 'text-white' : ''}>
                          {stats?.pendingCount ?? appointments.filter(a => a.status === 'pending').length}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterStatus('confirmed')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        filterStatus === 'confirmed'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-800 border-emerald-200 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${filterStatus === 'confirmed' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                        Confirmed
                      </span>
                      <div className="font-display font-bold text-xl mt-0.5 text-emerald-900">
                        <span className={filterStatus === 'confirmed' ? 'text-white' : ''}>
                          {stats?.confirmedUpcoming ?? appointments.filter(a => a.status === 'confirmed').length}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterStatus('completed')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        filterStatus === 'completed'
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white text-slate-800 border-blue-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${filterStatus === 'completed' ? 'text-blue-100' : 'text-blue-700'}`}>
                        Completed
                      </span>
                      <div className="font-display font-bold text-xl mt-0.5 text-blue-900">
                        <span className={filterStatus === 'completed' ? 'text-white' : ''}>
                          {stats?.completedTotal ?? appointments.filter(a => a.status === 'completed').length}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterStatus('cancelled')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        filterStatus === 'cancelled'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                          : 'bg-white text-slate-800 border-rose-200 hover:border-rose-300 shadow-2xs'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${filterStatus === 'cancelled' ? 'text-rose-100' : 'text-rose-700'}`}>
                        Cancelled
                      </span>
                      <div className="font-display font-bold text-xl mt-0.5 text-rose-900">
                        <span className={filterStatus === 'cancelled' ? 'text-white' : ''}>
                          {stats?.cancelledTotal ?? appointments.filter(a => a.status === 'cancelled').length}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('supabase')}
                      className="p-3 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-50 text-left transition-all shadow-2xs group"
                      title="View Supabase Synchronization Status"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                          Supabase
                        </span>
                        <Database className="w-3 h-3 text-teal-600 group-hover:rotate-12 transition-transform" />
                      </div>
                      <div className="font-display font-bold text-sm mt-1 text-teal-950 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{supabaseStatus?.syncedCount ?? 0} Synced</span>
                      </div>
                    </button>
                  </div>

                  {/* Filter & Search Toolbar */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-2.5 items-center text-xs">
                    {/* Status Select */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-teal-600"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending Confirmation</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Quick Date Presets */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickDatePreset('all');
                          setFilterDate('');
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          quickDatePreset === 'all' && !filterDate
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Dates
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setQuickDatePreset('today');
                          setFilterDate(today);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          quickDatePreset === 'today'
                            ? 'bg-white text-teal-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                          setQuickDatePreset('tomorrow');
                          setFilterDate(tomorrow);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          quickDatePreset === 'tomorrow'
                            ? 'bg-white text-teal-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tomorrow
                      </button>
                    </div>

                    {/* Custom Date input */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => {
                          setFilterDate(e.target.value);
                          setQuickDatePreset('custom');
                        }}
                        className="py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-teal-600"
                        title="Pick custom date"
                      />
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search patient name, phone, or appointment ID..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-teal-600"
                      />
                    </div>

                    {/* Reset Button */}
                    {(filterDate || filterStatus !== 'all' || filterSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterDate('');
                          setQuickDatePreset('all');
                          setFilterStatus('all');
                          setFilterSearch('');
                        }}
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold text-xs hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  {/* Appointment Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
                    {loadingAppts ? (
                      <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600" />
                        <span>Retrieving appointment records from database...</span>
                      </div>
                    ) : appointments.length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                        <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                        <span className="block font-semibold text-slate-700">No appointments found matching your filter</span>
                        <p className="text-[11px] text-slate-400">
                          Try adjusting search terms or status filters, or create a new booking using "+ New Booking".
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-3">Appt ID</th>
                            <th className="py-3 px-3">Patient</th>
                            <th className="py-3 px-3">Contact</th>
                            <th className="py-3 px-3">Service</th>
                            <th className="py-3 px-3">Date & Time</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Supabase</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {appointments.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Appt ID */}
                              <td className="py-3 px-3">
                                <span className="font-mono font-bold text-slate-900 block select-all">
                                  {a.appointment_id}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(a.created_at || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                              </td>

                              {/* Patient */}
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-900 block text-xs">
                                  {a.patient_name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                  {a.age && <span>{a.age} yrs</span>}
                                  {a.age && <span>·</span>}
                                  <span className="capitalize">{a.contact_method || 'Phone'}</span>
                                </div>
                              </td>

                              {/* Contact with WhatsApp & Call */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${a.phone}`}
                                    className="font-mono text-teal-700 hover:text-teal-900 font-semibold hover:underline block"
                                    title="Call patient"
                                  >
                                    {a.phone}
                                  </a>
                                  <a
                                    href={`https://wa.me/91${a.phone.replace(/\D/g, '').slice(-10)}?text=Namaste%20${encodeURIComponent(a.patient_name)},%20this%20is%20Dr.%20Vinayak%20Dental%20Clinic%20regarding%20your%20appointment%20(${encodeURIComponent(a.appointment_id)})%20on%20${encodeURIComponent(a.appointment_date)}%20at%20${encodeURIComponent(a.appointment_time)}.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-emerald-50 transition-colors"
                                    title="Chat on WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                                {a.email && (
                                  <span className="text-[10px] text-slate-400 block truncate max-w-[140px]" title={a.email}>
                                    {a.email}
                                  </span>
                                )}
                              </td>

                              {/* Service */}
                              <td className="py-3 px-3">
                                <span className="font-medium text-slate-800 block">
                                  {a.service_name || 'Consultation'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {a.duration_minutes || 30} mins
                                </span>
                              </td>

                              {/* Date & Time */}
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-900 block">
                                  {a.appointment_date}
                                </span>
                                <span className="font-mono text-teal-800 text-[11px] font-semibold bg-teal-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  {a.appointment_time}
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize inline-flex items-center gap-1 ${
                                    a.status === 'confirmed'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : a.status === 'completed'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : a.status === 'cancelled'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {a.status === 'confirmed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                  {a.status === 'cancelled' && <XCircle className="w-3 h-3 text-rose-600" />}
                                  {a.status === 'pending' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                                  {a.status === 'completed' && <Check className="w-3 h-3 text-blue-600" />}
                                  <span>{a.status}</span>
                                </span>
                              </td>

                              {/* Supabase Status */}
                              <td className="py-3 px-3">
                                {a.supabase_synced ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                    title="Synchronized to Supabase public.appointments table"
                                  >
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Synced</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                                    title={a.supabase_error || 'Pending synchronization to Supabase'}
                                  >
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>

                              {/* Row Action Buttons */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* View Details Modal Trigger */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedViewAppointment(a)}
                                    className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="View Full Appointment Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit Modal Trigger */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAppointment({ ...a });
                                      setFormError(null);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Edit Patient or Reschedule Slot"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Quick Confirm */}
                                  {a.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => updateAppointmentStatus(a.id, 'confirmed')}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors"
                                      title="Confirm Booking"
                                    >
                                      Confirm
                                    </button>
                                  )}

                                  {/* Quick Complete */}
                                  {a.status === 'confirmed' && (
                                    <button
                                      type="button"
                                      onClick={() => updateAppointmentStatus(a.id, 'completed')}
                                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold transition-colors"
                                      title="Mark Treatment Completed"
                                    >
                                      Done
                                    </button>
                                  )}

                                  {/* Cancel Trigger */}
                                  {a.status !== 'cancelled' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancellingAppointment(a);
                                        setCancelReason('Patient requested cancellation');
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Cancel Appointment"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => deleteAppointment(a.id, a.appointment_id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete Record Permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SERVICES CATALOG */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xl text-slate-900">
                        Dental Services Catalog
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configure treatments, durations, prices, and online booking availability
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsAddingService(true);
                        setEditingService({
                          id: '',
                          name: '',
                          category: 'General Dental',
                          description: '',
                          duration_minutes: 30,
                          price_display: 'Consultation based',
                          is_active: 1,
                          is_configured: 1,
                          details_treatment: '',
                          details_suitability: '',
                          details_prep: '',
                          details_aftercare: '',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-teal-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Service</span>
                    </button>
                  </div>

                  {/* Editing or Adding Form Drawer */}
                  {editingService && (
                    <div className="bg-white p-5 rounded-xl border border-teal-300 shadow-md space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-teal-800">
                          {isAddingService ? 'Add New Dental Service' : 'Edit Dental Service'}
                        </span>
                        <button
                          onClick={() => setEditingService(null)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">Service Name *</label>
                          <input
                            type="text"
                            required
                            value={editingService.name}
                            onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Category *</label>
                          <input
                            type="text"
                            value={editingService.category}
                            onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">Duration (Minutes)</label>
                          <input
                            type="number"
                            min="15"
                            step="15"
                            value={editingService.duration_minutes}
                            onChange={(e) => setEditingService({ ...editingService, duration_minutes: Number(e.target.value) })}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Price Label</label>
                          <input
                            type="text"
                            value={editingService.price_display}
                            onChange={(e) => setEditingService({ ...editingService, price_display: e.target.value })}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div className="flex items-center gap-4 pt-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingService.is_active === 1}
                              onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked ? 1 : 0 })}
                              className="rounded text-teal-600"
                            />
                            <span>Active in Booking</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingService.is_configured === 1}
                              onChange={(e) => setEditingService({ ...editingService, is_configured: e.target.checked ? 1 : 0 })}
                              className="rounded text-teal-600"
                            />
                            <span>Verified by Clinic</span>
                          </label>
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block font-semibold mb-1">Service Description</label>
                        <textarea
                          rows={2}
                          value={editingService.description}
                          onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingService(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveService(editingService)}
                          className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-teal-700"
                        >
                          Save Service
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Services List Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Service Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Price Display</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {services.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {s.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{s.category}</td>
                            <td className="py-2.5 px-3">{s.duration_minutes} min</td>
                            <td className="py-2.5 px-3">{s.price_display}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                {s.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setIsAddingService(false);
                                    setEditingService(s);
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-800"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteService(s.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: WORKING HOURS & AVAILABILITY */}
              {activeTab === 'hours' && (
                <div className="space-y-4 max-w-3xl">
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      Working Hours & Slot Duration
                    </h3>
                    <p className="text-xs text-slate-500">
                      Default hours: Monday to Saturday 9:00 AM – 8:00 PM; Sunday: Closed
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                    <div className="space-y-3">
                      {workingHours.map((wh, idx) => (
                        <div
                          key={wh.day_of_week}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
                        >
                          <div className="w-28 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={wh.is_open === 1}
                              onChange={(e) => {
                                const copy = [...workingHours];
                                copy[idx].is_open = e.target.checked ? 1 : 0;
                                setWorkingHours(copy);
                              }}
                              className="rounded text-teal-600"
                            />
                            <span className="font-semibold text-slate-900">{wh.day_name}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Open:</span>
                              <input
                                type="time"
                                disabled={wh.is_open === 0}
                                value={wh.open_time}
                                onChange={(e) => {
                                  const copy = [...workingHours];
                                  copy[idx].open_time = e.target.value;
                                  setWorkingHours(copy);
                                }}
                                className="p-1 border rounded bg-white text-xs disabled:opacity-50"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Close:</span>
                              <input
                                type="time"
                                disabled={wh.is_open === 0}
                                value={wh.close_time}
                                onChange={(e) => {
                                  const copy = [...workingHours];
                                  copy[idx].close_time = e.target.value;
                                  setWorkingHours(copy);
                                }}
                                className="p-1 border rounded bg-white text-xs disabled:opacity-50"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Slot:</span>
                              <select
                                disabled={wh.is_open === 0}
                                value={wh.slot_duration_minutes}
                                onChange={(e) => {
                                  const copy = [...workingHours];
                                  copy[idx].slot_duration_minutes = Number(e.target.value);
                                  setWorkingHours(copy);
                                }}
                                className="p-1 border rounded bg-white text-xs disabled:opacity-50"
                              >
                                <option value="15">15 min</option>
                                <option value="30">30 min</option>
                                <option value="45">45 min</option>
                                <option value="60">60 min</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveWorkingHours}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Working Hours</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DOCTOR PROFILE */}
              {activeTab === 'doctor' && doctor && (
                <div className="space-y-4 max-w-3xl">
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      Doctor Profile & Verified Credentials
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update verified degrees, experience, and registration for Dr. Vinayak
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Doctor Name</label>
                        <input
                          type="text"
                          value={doctor.name}
                          onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Specialization</label>
                        <input
                          type="text"
                          value={doctor.specialization}
                          onChange={(e) => setDoctor({ ...doctor, specialization: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Qualification</label>
                        <input
                          type="text"
                          value={doctor.qualification}
                          onChange={(e) => setDoctor({ ...doctor, qualification: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Years of Experience</label>
                        <input
                          type="text"
                          value={doctor.experience_years}
                          onChange={(e) => setDoctor({ ...doctor, experience_years: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Dental Registration No.</label>
                        <input
                          type="text"
                          value={doctor.registration_number}
                          onChange={(e) => setDoctor({ ...doctor, registration_number: e.target.value })}
                          className="w-full p-2 border rounded font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Consultation Languages</label>
                      <input
                        type="text"
                        value={doctor.languages}
                        onChange={(e) => setDoctor({ ...doctor, languages: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Biography / About Dr. Vinayak</label>
                      <textarea
                        rows={3}
                        value={doctor.biography}
                        onChange={(e) => setDoctor({ ...doctor, biography: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveDoctor}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Doctor Profile</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: CLINIC SETTINGS */}
              {activeTab === 'settings' && settings && (
                <div className="space-y-4 max-w-3xl">
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      Clinic Information & Contact Setup
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update verified address, phone, WhatsApp, and Google Maps destination
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Clinic Name</label>
                        <input
                          type="text"
                          value={settings.clinic_name}
                          onChange={(e) => setSettings({ ...settings, clinic_name: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Business Category</label>
                        <input
                          type="text"
                          value={settings.business_category}
                          onChange={(e) => setSettings({ ...settings, business_category: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={settings.phone}
                          onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                          className="w-full p-2 border rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">WhatsApp Number</label>
                        <input
                          type="text"
                          value={settings.whatsapp}
                          onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                          className="w-full p-2 border rounded font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Address Line 1</label>
                      <input
                        type="text"
                        value={settings.address_line1}
                        onChange={(e) => setSettings({ ...settings, address_line1: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Landmark</label>
                        <input
                          type="text"
                          value={settings.address_landmark}
                          onChange={(e) => setSettings({ ...settings, address_landmark: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">City & State</label>
                        <input
                          type="text"
                          value={`${settings.address_city}, ${settings.address_state}`}
                          onChange={(e) => {
                            const [c, s] = e.target.value.split(',');
                            setSettings({
                              ...settings,
                              address_city: (c || '').trim(),
                              address_state: (s || '').trim(),
                            });
                          }}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Pincode</label>
                        <input
                          type="text"
                          value={settings.address_pincode}
                          onChange={(e) => setSettings({ ...settings, address_pincode: e.target.value })}
                          className="w-full p-2 border rounded font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Google Maps Link</label>
                      <input
                        type="text"
                        value={settings.google_maps_url}
                        onChange={(e) => setSettings({ ...settings, google_maps_url: e.target.value })}
                        className="w-full p-2 border rounded font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Hero Section Headline</label>
                      <input
                        type="text"
                        value={settings.hero_headline}
                        onChange={(e) => setSettings({ ...settings, hero_headline: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Clinic Settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SUPABASE DATABASE INTEGRATION */}
              {activeTab === 'supabase' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-xl text-slate-900">
                          Supabase Database Integration
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Connected
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        All patient appointment bookings are automatically mirrored into your Supabase database in real-time.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchSupabaseStatus}
                        disabled={loadingSupabase}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-2xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingSupabase ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
                        <span>{loadingSupabase ? 'Testing...' : 'Test Connection'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSyncAllSupabase}
                        disabled={syncingAll}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                      >
                        <Server className="w-3.5 h-3.5" />
                        <span>{syncingAll ? 'Syncing...' : 'Sync All Bookings'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Supabase Connection
                      </span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${supabaseStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className="font-semibold text-sm text-slate-900">
                          {supabaseStatus?.connected ? 'Active & Reachable' : 'Connecting...'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        Project ID: rchbbdrpilabsspcmtks
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Database Schema
                      </span>
                      <div className="flex items-center gap-2">
                        {supabaseStatus?.tableReady ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-sm text-emerald-800">
                              appointments Table Ready
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span className="font-semibold text-sm text-amber-800">
                              Table Setup Pending
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {supabaseStatus?.tableReady
                          ? 'Schema active with RLS policies'
                          : 'Run SQL script below in Supabase'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Sync Count
                      </span>
                      <div className="font-mono text-xl font-bold text-slate-900">
                        {supabaseStatus?.syncedCount ?? 0}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          / {supabaseStatus?.totalCount ?? 0} synced
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {(supabaseStatus?.unsyncedCount ?? 0) === 0
                          ? 'All local bookings mirrored'
                          : `${supabaseStatus?.unsyncedCount} bookings pending sync`}
                      </span>
                    </div>
                  </div>

                  {/* Credentials & Project Info */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Database className="w-4 h-4 text-teal-700" />
                        <span>Configured Supabase Instance</span>
                      </h4>
                      <a
                        href="https://supabase.com/dashboard/project/rchbbdrpilabsspcmtks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                      >
                        <span>Open Supabase Dashboard</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-500 block font-medium">Project ID</span>
                        <code className="text-slate-900 font-mono font-semibold block text-sm select-all">
                          rchbbdrpilabsspcmtks
                        </code>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-500 block font-medium">Endpoint URL</span>
                        <code className="text-slate-900 font-mono font-semibold block text-sm select-all">
                          https://rchbbdrpilabsspcmtks.supabase.co
                        </code>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 md:col-span-2">
                        <span className="text-slate-500 block font-medium">Publishable API Key</span>
                        <code className="text-slate-900 font-mono text-xs block break-all select-all bg-white p-2 rounded border border-slate-200">
                          sb_publishable_UX3cr_jx32rCcyDOXSkGNA_baw3uk86
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* SQL Setup Instructions */}
                  <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <span>Supabase Table SQL Script</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Run this once in the <strong className="text-teal-300">Supabase SQL Editor</strong> to create the table and enable anonymous permissions.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const sql = supabaseStatus?.sqlSetup || `-- Supabase SQL Setup for Dr. Vinayak Dental Clinic
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow public insert, select and update
DROP POLICY IF EXISTS "Allow public insert" ON public.appointments;
CREATE POLICY "Allow public insert" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select" ON public.appointments;
CREATE POLICY "Allow public select" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update" ON public.appointments;
CREATE POLICY "Allow public update" ON public.appointments FOR UPDATE USING (true);`;
                          navigator.clipboard.writeText(sql);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 3000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      >
                        {copiedSql ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy SQL Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-teal-200 overflow-x-auto max-h-56 leading-relaxed">
                      <pre>
{`CREATE TABLE IF NOT EXISTS public.appointments (
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

-- Row Level Security (RLS) & Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON public.appointments FOR UPDATE USING (true);`}
                      </pre>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Quick steps:</span>
                      <ol className="list-decimal list-inside flex gap-3 text-slate-300">
                        <li>Copy SQL code</li>
                        <li>
                          <a
                            href="https://supabase.com/dashboard/project/rchbbdrpilabsspcmtks/sql"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 underline hover:text-teal-300"
                          >
                            Open SQL Editor
                          </a>
                        </li>
                        <li>Paste & Click "Run"</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: FAQS */}
              {activeTab === 'faqs' && (
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xl text-slate-900">
                        Patient FAQs
                      </h3>
                      <p className="text-xs text-slate-500">
                        Manage questions and answers displayed on the website
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {faqs.map((f, idx) => (
                      <div key={f.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900">{f.question}</span>
                        </div>
                        <p className="text-slate-600">{f.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: GALLERY */}
              {activeTab === 'gallery' && (
                <div className="space-y-4 max-w-3xl">
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      Clinic Gallery Items
                    </h3>
                    <p className="text-xs text-slate-500">
                      Photographs and clinical spaces showcased to patients
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {gallery.map((g) => (
                      <div key={g.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="aspect-4/3 rounded-lg overflow-hidden bg-slate-100">
                          <img src={g.image_url} alt={g.title} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-slate-900 block">{g.title}</span>
                        <span className="text-[11px] text-teal-800">{g.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </main>
          </div>
        )}

        {/* MODAL 1: VIEW APPOINTMENT DETAILS */}
        {selectedViewAppointment && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          >
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in duration-150">
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs font-mono">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base">Appointment Details</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        {selectedViewAppointment.appointment_id}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Booked on {new Date(selectedViewAppointment.created_at || '').toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedViewAppointment(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Status & Timing Banner */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {selectedViewAppointment.appointment_date} at {selectedViewAppointment.appointment_time}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Duration: {selectedViewAppointment.duration_minutes || 30} minutes
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      selectedViewAppointment.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedViewAppointment.status === 'completed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : selectedViewAppointment.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {selectedViewAppointment.status}
                  </span>
                </div>

                {/* Patient Information Card */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                    <User className="w-3.5 h-3.5 text-teal-700" />
                    <span>Patient Profile & Contact</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Full Name</span>
                      <span className="font-bold text-slate-900 text-sm block">
                        {selectedViewAppointment.patient_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Age</span>
                      <span className="font-semibold text-slate-900 block">
                        {selectedViewAppointment.age ? `${selectedViewAppointment.age} years old` : 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Phone Number</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={`tel:${selectedViewAppointment.phone}`}
                          className="font-mono font-bold text-teal-700 hover:underline text-sm"
                        >
                          {selectedViewAppointment.phone}
                        </a>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Preferred Contact</span>
                      <span className="capitalize font-semibold text-slate-800">
                        {selectedViewAppointment.contact_method || 'Phone'}
                      </span>
                    </div>

                    {selectedViewAppointment.email && (
                      <div className="col-span-2">
                        <span className="text-[11px] text-slate-400 block">Email Address</span>
                        <a
                          href={`mailto:${selectedViewAppointment.email}`}
                          className="font-semibold text-slate-800 hover:text-teal-700 hover:underline"
                        >
                          {selectedViewAppointment.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Direct Contact Action Buttons */}
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                    <a
                      href={`tel:${selectedViewAppointment.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-700" />
                      <span>Call Patient</span>
                    </a>

                    <a
                      href={`https://wa.me/91${selectedViewAppointment.phone.replace(/\D/g, '').slice(-10)}?text=Namaste%20${encodeURIComponent(selectedViewAppointment.patient_name)},%20this%20is%20Dr.%20Vinayak%20Dental%20Clinic%20regarding%20your%20appointment%20(${encodeURIComponent(selectedViewAppointment.appointment_id)})%20on%20${encodeURIComponent(selectedViewAppointment.appointment_date)}%20at%20${encodeURIComponent(selectedViewAppointment.appointment_time)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Message</span>
                    </a>
                  </div>
                </div>

                {/* Treatment & Reason */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                    <span>Clinical Procedure & Symptoms</span>
                  </h4>
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-400 block">Selected Treatment</span>
                    <span className="font-bold text-slate-900 text-sm block">
                      {selectedViewAppointment.service_name || 'General Dental Consultation'}
                    </span>
                  </div>
                  {selectedViewAppointment.reason && (
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-400 block">Patient Notes / Symptoms</span>
                      <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 text-xs italic">
                        "{selectedViewAppointment.reason}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Clinical Admin Notes */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-teal-700" />
                      <span>Internal Doctor / Staff Notes</span>
                    </h4>
                  </div>
                  <textarea
                    rows={2}
                    value={selectedViewAppointment.admin_notes || ''}
                    onChange={(e) =>
                      setSelectedViewAppointment({
                        ...selectedViewAppointment,
                        admin_notes: e.target.value
                      })
                    }
                    placeholder="Enter diagnosis, prescription remarks, or follow-up notes..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateAppointmentStatus(
                        selectedViewAppointment.id,
                        selectedViewAppointment.status,
                        selectedViewAppointment.admin_notes
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Note</span>
                  </button>
                </div>

                {/* Database Synchronization Indicator */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-teal-700" />
                    <span className="font-medium text-slate-700">Supabase Cloud Sync:</span>
                    {selectedViewAppointment.supabase_synced ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Synchronized</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-400 text-[10px]">
                    ID: {selectedViewAppointment.id}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {selectedViewAppointment.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        updateAppointmentStatus(selectedViewAppointment.id, 'confirmed');
                        setSelectedViewAppointment({ ...selectedViewAppointment, status: 'confirmed' });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Appointment</span>
                    </button>
                  )}

                  {selectedViewAppointment.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => {
                        updateAppointmentStatus(selectedViewAppointment.id, 'completed');
                        setSelectedViewAppointment({ ...selectedViewAppointment, status: 'completed' });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const appt = selectedViewAppointment;
                      setSelectedViewAppointment(null);
                      setEditingAppointment({ ...appt });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Booking</span>
                  </button>

                  {selectedViewAppointment.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => {
                        const appt = selectedViewAppointment;
                        setSelectedViewAppointment(null);
                        setCancellingAppointment(appt);
                        setCancelReason('Patient requested cancellation');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedViewAppointment(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: FULL EDIT APPOINTMENT (Reschedule, Change Service, Patient Info, Status, Notes) */}
        {editingAppointment && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in duration-150">
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base">Edit & Reschedule Appointment</h3>
                    <span className="font-mono text-xs text-teal-300">
                      Ref: {editingAppointment.appointment_id}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveAppointmentEdit} className="p-5 overflow-y-auto space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Patient Information Section */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">
                    Patient Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Patient Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editingAppointment.patient_name}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, patient_name: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={editingAppointment.phone}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, phone: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg font-mono focus:outline-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={editingAppointment.email || ''}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, email: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Patient Age (Optional)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={editingAppointment.age || ''}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, age: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Treatment & Timing Section */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">
                    Appointment Schedule & Treatment
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1 text-slate-700">Dental Service / Procedure *</label>
                      <select
                        required
                        value={editingAppointment.service_id}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, service_id: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg bg-white focus:outline-teal-600"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.duration_minutes} mins · {s.price_display})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Appointment Date *</label>
                      <input
                        type="date"
                        required
                        value={editingAppointment.appointment_date}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, appointment_date: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Time Slot *</label>
                      <select
                        required
                        value={editingAppointment.appointment_time}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, appointment_time: e.target.value })
                        }
                        className="w-full p-2.5 border rounded-lg bg-white font-mono focus:outline-teal-600"
                      >
                        {[
                          '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
                          '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Status *</label>
                      <select
                        required
                        value={editingAppointment.status}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, status: e.target.value as any })
                        }
                        className="w-full p-2.5 border rounded-lg bg-white focus:outline-teal-600 font-semibold"
                      >
                        <option value="pending">Pending Confirmation</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Preferred Contact Method</label>
                      <select
                        value={editingAppointment.contact_method}
                        onChange={(e) =>
                          setEditingAppointment({ ...editingAppointment, contact_method: e.target.value as any })
                        }
                        className="w-full p-2.5 border rounded-lg bg-white focus:outline-teal-600"
                      >
                        <option value="phone">Phone Call</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notes & Symptoms */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">
                    Clinical Notes & Symptoms
                  </h4>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Patient Reason / Symptoms</label>
                    <textarea
                      rows={2}
                      value={editingAppointment.reason || ''}
                      onChange={(e) =>
                        setEditingAppointment({ ...editingAppointment, reason: e.target.value })
                      }
                      className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                      placeholder="e.g. Toothache, mild swelling on lower molar"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Internal Doctor / Staff Admin Notes</label>
                    <textarea
                      rows={2}
                      value={editingAppointment.admin_notes || ''}
                      onChange={(e) =>
                        setEditingAppointment({ ...editingAppointment, admin_notes: e.target.value })
                      }
                      className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                      placeholder="e.g. Scaling completed, prescribed paracetamol, follow-up in 2 weeks"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAppointment(null)}
                    disabled={actionLoading}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'Saving...' : 'Save & Sync Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: LOG WALK-IN / NEW BOOKING */}
        {isAddingAppointment && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          >
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in duration-150">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base">Book Walk-In or Phone Patient</h3>
                    <p className="text-[11px] text-slate-400">Direct clinic reception entry with instant confirmation</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingAppointment(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointmentSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patil"
                      value={newApptData.patient_name}
                      onChange={(e) => setNewApptData({ ...newApptData, patient_name: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={newApptData.phone}
                      onChange={(e) => setNewApptData({ ...newApptData, phone: e.target.value })}
                      className="w-full p-2.5 border rounded-lg font-mono focus:outline-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Age (Optional)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="e.g. 35"
                      value={newApptData.age}
                      onChange={(e) => setNewApptData({ ...newApptData, age: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700">Dental Service *</label>
                    <select
                      required
                      value={newApptData.service_id}
                      onChange={(e) => setNewApptData({ ...newApptData, service_id: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-white focus:outline-teal-600"
                    >
                      <option value="">-- Choose a Service --</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.duration_minutes} mins · {s.price_display})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Appointment Date *</label>
                    <input
                      type="date"
                      required
                      value={newApptData.appointment_date}
                      onChange={(e) => setNewApptData({ ...newApptData, appointment_date: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Time Slot *</label>
                    <select
                      required
                      value={newApptData.appointment_time}
                      onChange={(e) => setNewApptData({ ...newApptData, appointment_time: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-white font-mono focus:outline-teal-600"
                    >
                      {[
                        '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
                        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700">Symptoms / Chief Complaint</label>
                    <input
                      type="text"
                      placeholder="e.g. Tooth sensitivity, checkup, cavity pain"
                      value={newApptData.reason}
                      onChange={(e) => setNewApptData({ ...newApptData, reason: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:outline-teal-600"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAppointment(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'Creating...' : 'Create Appointment'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: CANCEL CONFIRMATION DIALOG */}
        {cancellingAppointment && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          >
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in duration-150">
              <div className="bg-rose-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-200 flex items-center justify-center">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base">Cancel Appointment</h3>
                    <span className="font-mono text-xs text-rose-200">
                      {cancellingAppointment.appointment_id}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCancellingAppointment(null)}
                  className="p-1.5 text-rose-300 hover:text-white rounded-lg hover:bg-rose-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-sm">
                    {cancellingAppointment.patient_name}
                  </span>
                  <span className="text-slate-600 block">
                    {cancellingAppointment.appointment_date} at {cancellingAppointment.appointment_time} · {cancellingAppointment.service_name}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] block">
                    Phone: {cancellingAppointment.phone}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">Reason for Cancellation</label>
                  
                  {/* Preset reason chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Patient called to cancel',
                      'Patient did not show up',
                      'Doctor emergency',
                      'Rescheduled to later date',
                      'Duplicate booking'
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCancelReason(chip)}
                        className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                          cancelReason === chip
                            ? 'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-rose-600"
                    placeholder="Provide cancellation details or reason..."
                  />
                  <p className="text-[11px] text-slate-400">
                    Cancelling will immediately release this time slot for other patients and update the Supabase database.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCancellingAppointment(null)}
                    disabled={actionLoading}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                  >
                    Keep Appointment
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
