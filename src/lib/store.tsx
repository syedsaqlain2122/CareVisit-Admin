import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { invokeAdminAuth, supabase } from './supabase';
import {
  orderPayment,
  type AdminAccount,
  type Nurse,
  type OrderStatus,
  type Patient,
  type PharmacyOrder,
  type VerificationStatus,
  type VisitRequest,
  type VisitStatus,
} from './types';

type OneOrMany<T> = T | T[] | null;

function first<T>(value: OneOrMany<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseWindow(raw: string | null): { start: string | null; end: string | null } {
  if (!raw) return { start: null, end: null };
  const parts = raw.split(/[–-]/).map((s) => s.trim()).filter(Boolean);
  return { start: parts[0] ?? null, end: parts[1] ?? null };
}

function mapVisit(row: Record<string, unknown>): VisitRequest {
  const patient = first(row.patient as OneOrMany<{ full_name?: string; phone?: string }>);
  const service = first(row.service as OneOrMany<{ title?: string; requires_prescription?: boolean }>);
  const address = first(row.address as OneOrMany<{ line?: string; area_label?: string; label?: string }>);
  const window = parseWindow((row.preferred_window as string | null) ?? null);
  const fee = Number(row.estimated_fee_pkr ?? 0);
  return {
    id: String(row.id),
    code: String(row.public_code ?? row.id).slice(0, 12),
    patientId: String(row.patient_id),
    patientName: patient?.full_name || 'Patient',
    patientPhone: patient?.phone || '—',
    service: service?.title || 'Visit',
    address: [address?.line, address?.area_label].filter(Boolean).join(', ') || '—',
    preferredDate: (row.preferred_start_date as string | null) ?? 'Flexible',
    durationDays: Number(row.duration_days ?? 1),
    feePkr: Number.isFinite(fee) ? fee : 0,
    status: (row.status as VisitStatus) ?? 'open',
    nurseId: (row.assigned_nurse_id as string | null) ?? null,
    windowStart: window.start,
    windowEnd: window.end,
    notes: (row.description as string | null) ?? '',
    requiresRx: Boolean(service?.requires_prescription),
    createdAt: String(row.created_at ?? ''),
  };
}

function mapNurse(row: Record<string, unknown>): Nurse {
  const np = first(
    row.nurse_profiles as OneOrMany<{
      specialty?: string | null;
      license_number?: string | null;
      is_accepting_jobs?: boolean;
      credentials_label?: string | null;
    }>,
  );
  return {
    id: String(row.id),
    name: (row.full_name as string | null) || 'Nurse',
    specialty: np?.specialty || np?.credentials_label || 'General nursing',
    phone: (row.phone as string | null) || '—',
    email: (row.email as string | null) || '—',
    license: np?.license_number || '—',
    accepting: np?.is_accepting_jobs ?? true,
  };
}

function mapPatient(row: Record<string, unknown>): Patient {
  const addresses = row.addresses as OneOrMany<{ area_label?: string | null; is_primary?: boolean; line?: string }> | undefined;
  const list = !addresses ? [] : Array.isArray(addresses) ? addresses : [addresses];
  const primary = list.find((a) => a.is_primary) ?? list[0];
  return {
    id: String(row.id),
    name: (row.full_name as string | null) || 'Patient',
    phone: (row.phone as string | null) || '—',
    email: (row.email as string | null) || '—',
    cnic: (row.cnic_number as string | null) || '—',
    verification: ((row.verification_status as VerificationStatus) ?? 'unverified'),
    city: primary?.area_label || '—',
  };
}

function mapOrder(row: Record<string, unknown>): PharmacyOrder {
  const patient = first(row.patient as OneOrMany<{ full_name?: string }>);
  const items = row.order_items as OneOrMany<{ qty?: number; medicines?: OneOrMany<{ name?: string }> }> | undefined;
  const list = !items ? [] : Array.isArray(items) ? items : [items];
  const labels = list.map((item) => {
    const med = first(item.medicines ?? null);
    return `${item.qty ?? 1}× ${med?.name ?? 'Item'}`;
  });
  const status = (row.status as OrderStatus) ?? 'placed';
  return {
    id: String(row.id),
    code: String(row.public_code ?? row.id).slice(0, 12),
    patientName: patient?.full_name || 'Patient',
    items: labels.join(', ') || '—',
    totalPkr: Number(row.total_pkr ?? 0),
    status,
    payment: orderPayment(status),
    createdAt: String(row.created_at ?? ''),
  };
}

function mapAdmin(row: Record<string, unknown>): AdminAccount {
  return {
    id: String(row.id),
    name: (row.full_name as string | null) || 'Admin',
    email: (row.email as string | null) || '',
    createdAt: String(row.created_at ?? ''),
  };
}

type LiveState = {
  nurses: Nurse[];
  patients: Patient[];
  visits: VisitRequest[];
  orders: PharmacyOrder[];
  admins: AdminAccount[];
};

const EMPTY: LiveState = {
  nurses: [],
  patients: [],
  visits: [],
  orders: [],
  admins: [],
};

type StoreApi = LiveState & {
  currentAdmin: AdminAccount | null;
  authReady: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  addAdmin: (input: { name: string; email: string; password: string }) => Promise<string | null>;
  removeAdmin: (id: string) => Promise<string | null>;
  assignVisit: (id: string, nurseId: string, windowStart: string, windowEnd: string) => Promise<string | null>;
  setVisitStatus: (id: string, status: VisitStatus) => Promise<string | null>;
  setVerification: (patientId: string, status: VerificationStatus) => Promise<string | null>;
  setOrderStatus: (id: string, status: OrderStatus) => Promise<string | null>;
  toggleNurseAccepting: (id: string) => Promise<string | null>;
};

const StoreContext = createContext<StoreApi | null>(null);

async function fetchLive(): Promise<LiveState> {
  const [nursesRes, patientsRes, visitsRes, ordersRes, adminsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, full_name, phone, email, created_at, nurse_profiles (specialty, license_number, is_accepting_jobs, credentials_label)',
      )
      .eq('role', 'nurse')
      .order('full_name'),
    supabase
      .from('profiles')
      .select('id, full_name, phone, email, cnic_number, verification_status, addresses (area_label, is_primary, line)')
      .eq('role', 'patient')
      .order('created_at', { ascending: false }),
    supabase
      .from('visit_requests')
      .select(
        `
        id, public_code, status, duration_days, estimated_fee_pkr,
        preferred_start_date, preferred_window, description, assigned_nurse_id, patient_id, created_at,
        patient:profiles!visit_requests_patient_id_fkey (full_name, phone),
        service:services (title, requires_prescription),
        address:addresses (line, area_label, label)
      `,
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select(
        `
        id, public_code, status, total_pkr, created_at,
        patient:profiles!orders_patient_id_fkey (full_name),
        order_items (qty, medicines (name))
      `,
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'admin')
      .order('created_at'),
  ]);

  const firstError =
    nursesRes.error?.message ||
    patientsRes.error?.message ||
    visitsRes.error?.message ||
    ordersRes.error?.message ||
    adminsRes.error?.message;
  if (firstError) throw new Error(firstError);

  return {
    nurses: (nursesRes.data ?? []).map((row: Record<string, unknown>) => mapNurse(row)),
    patients: (patientsRes.data ?? []).map((row: Record<string, unknown>) => mapPatient(row)),
    visits: (visitsRes.data ?? []).map((row: Record<string, unknown>) => mapVisit(row)),
    orders: (ordersRes.data ?? []).map((row: Record<string, unknown>) => mapOrder(row)),
    admins: (adminsRes.data ?? []).map((row: Record<string, unknown>) => mapAdmin(row)),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const [data, setData] = useState<LiveState>(EMPTY);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchLive();
      setData(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load live data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event: string, session: { user?: { id: string; email?: string } } | null) => {
      if (!session?.user) {
        setCurrentAdmin(null);
        setData(EMPTY);
        setAuthReady(true);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, role')
        .eq('id', session.user.id)
        .maybeSingle();
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setCurrentAdmin(null);
        setData(EMPTY);
        setAuthReady(true);
        return;
      }
      setCurrentAdmin({
        id: profile.id,
        name: profile.full_name || 'Admin',
        email: profile.email || session.user.email || '',
        createdAt: profile.created_at,
      });
      setAuthReady(true);
      await refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const api = useMemo<StoreApi>(
    () => ({
      ...data,
      currentAdmin,
      authReady,
      loading,
      error,
      refresh,
      login: async (email, password) => {
        const boot = await invokeAdminAuth({ action: 'bootstrap' }, false);
        if (boot.error) return boot.error;
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) return authError.message;
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return 'Sign in failed.';
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .maybeSingle();
        if (profile?.role !== 'admin') {
          await supabase.auth.signOut();
          return 'This account is not an admin.';
        }
        return null;
      },
      logout: async () => {
        await supabase.auth.signOut();
      },
      addAdmin: async ({ name, email, password }) => {
        const result = await invokeAdminAuth(
          { action: 'create', name: name.trim(), email: email.trim().toLowerCase(), password },
          true,
        );
        if (result.error) return result.error;
        await refresh();
        return null;
      },
      removeAdmin: async (id) => {
        const result = await invokeAdminAuth({ action: 'delete', userId: id }, true);
        if (result.error) return result.error;
        await refresh();
        return null;
      },
      assignVisit: async (id, nurseId, windowStart, windowEnd) => {
        const { error: updateError } = await supabase
          .from('visit_requests')
          .update({
            assigned_nurse_id: nurseId,
            preferred_window: `${windowStart}–${windowEnd}`,
            status: 'assigned',
          })
          .eq('id', id);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      setVisitStatus: async (id, status) => {
        const { error: updateError } = await supabase.from('visit_requests').update({ status }).eq('id', id);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      setVerification: async (patientId, status) => {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ verification_status: status })
          .eq('id', patientId);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      setOrderStatus: async (id, status) => {
        const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', id);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      toggleNurseAccepting: async (id) => {
        const nurse = data.nurses.find((n) => n.id === id);
        const { error: updateError } = await supabase
          .from('nurse_profiles')
          .update({ is_accepting_jobs: !(nurse?.accepting ?? true) })
          .eq('profile_id', id);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
    }),
    [data, currentAdmin, authReady, loading, error, refresh],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function nurseName(nurses: { id: string; name: string }[], id: string | null) {
  if (!id) return 'Unassigned';
  return nurses.find((n) => n.id === id)?.name ?? 'Unassigned';
}

export function money(pkr: number) {
  return `Rs ${pkr.toLocaleString('en-PK')}`;
}
