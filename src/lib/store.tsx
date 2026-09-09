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
  MEDICINE_CATEGORIES,
  orderPayment,
  type AdminAccount,
  type CatalogMedicine,
  type HowToUseStep,
  type IdReview,
  type InsuranceReview,
  type MedicineCategory,
  type MedicineInput,
  type Nurse,
  type NurseReview,
  type OrderLineItem,
  type OrderStatus,
  type Patient,
  type PharmacyOrder,
  type ReviewDoc,
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
    cancellationReason: ((row.cancellation_reason as string | null) ?? '').trim() || null,
    cancelledBy:
      row.cancelled_by === 'patient' || row.cancelled_by === 'admin'
        ? row.cancelled_by
        : null,
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
    suspended: row.account_status === 'suspended',
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

function mapOrder(row: Record<string, unknown>, rxUrls: Map<string, string | null>): PharmacyOrder {
  const patient = first(row.patient as OneOrMany<{ full_name?: string; phone?: string }>);
  const address = first(
    row.delivery as OneOrMany<{ label?: string; line?: string; area_label?: string; notes?: string }>,
  );
  const items = row.order_items as
    | OneOrMany<{ qty?: number; unit_price_pkr?: number; medicines?: OneOrMany<{ name?: string }> }>
    | undefined;
  const list = !items ? [] : Array.isArray(items) ? items : [items];
  const lineItems: OrderLineItem[] = list.map((item) => {
    const med = first(item.medicines ?? null);
    return {
      name: med?.name ?? 'Item',
      qty: Number(item.qty ?? 1),
      unitPricePkr: Number(item.unit_price_pkr ?? 0),
    };
  });
  const labels = lineItems.map((item) => `${item.qty}× ${item.name}`);
  const status = (row.status as OrderStatus) ?? 'placed';
  const rxPath = ((row.prescription_path as string | null) ?? '').trim() || null;
  const addressParts = [address?.line, address?.area_label].filter(Boolean);
  return {
    id: String(row.id),
    code: String(row.public_code ?? row.id).slice(0, 12),
    patientId: String(row.patient_id ?? ''),
    patientName: patient?.full_name || 'Patient',
    patientPhone: patient?.phone?.trim() || '—',
    items: labels.join(', ') || '—',
    lineItems,
    subtotalPkr: Number(row.subtotal_pkr ?? 0),
    taxPkr: Number(row.tax_pkr ?? 0),
    totalPkr: Number(row.total_pkr ?? 0),
    status,
    payment: orderPayment(status),
    paymentMethod: 'Cash on delivery',
    addressLabel: address?.label?.trim() || null,
    addressLine: addressParts.length > 0 ? addressParts.join(', ') : null,
    addressNotes: address?.notes?.trim() || null,
    prescriptionPath: rxPath,
    prescriptionUrl: rxPath ? rxUrls.get(rxPath) ?? null : null,
    createdAt: String(row.created_at ?? ''),
    cancellationReason: ((row.cancellation_reason as string | null) ?? '').trim() || null,
    cancelledBy:
      row.cancelled_by === 'patient' || row.cancelled_by === 'admin' ? row.cancelled_by : null,
  };
}

function isMedicineCategory(value: string): value is MedicineCategory {
  return MEDICINE_CATEGORIES.some((c) => c.key === value);
}

function mapHowToUse(value: unknown): HowToUseStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
      const step = entry as { title?: unknown; body?: unknown };
      const title = typeof step.title === 'string' ? step.title.trim() : '';
      const body = typeof step.body === 'string' ? step.body.trim() : '';
      if (!title && !body) return null;
      return { title, body };
    })
    .filter((step): step is HowToUseStep => step !== null);
}

function mapSafetyTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((tag) => (typeof tag === 'string' ? tag.trim() : '')).filter(Boolean);
}

function mapMedicine(row: Record<string, unknown>): CatalogMedicine {
  const category = String(row.category ?? 'pain');
  const description = row.description;
  const text = Array.isArray(description)
    ? description.filter((d) => typeof d === 'string').join('\n\n')
    : typeof description === 'string'
      ? description
      : '';
  return {
    id: String(row.id),
    name: (row.name as string) || 'Medicine',
    subtitle: (row.subtitle as string) || '',
    pricePkr: Number(row.price_pkr ?? 0),
    category: isMedicineCategory(category) ? category : 'pain',
    rxRequired: Boolean(row.rx_required),
    available: row.available !== false,
    stockQty: Math.max(0, Number(row.stock_qty ?? 0)),
    description: text,
    howToUse: mapHowToUse(row.how_to_use),
    safetyTags: mapSafetyTags(row.safety_tags),
    imageUrl: ((row.image_url as string | null) ?? '').trim() || null,
    active: row.active !== false,
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
  medicines: CatalogMedicine[];
  admins: AdminAccount[];
  idReviews: IdReview[];
  insuranceReviews: InsuranceReview[];
  nurseReviews: NurseReview[];
};

const EMPTY: LiveState = {
  nurses: [],
  patients: [],
  visits: [],
  orders: [],
  medicines: [],
  admins: [],
  idReviews: [],
  insuranceReviews: [],
  nurseReviews: [],
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
  cancelVisit: (id: string, reason: string) => Promise<string | null>;
  setVerification: (
    profileId: string,
    status: Extract<VerificationStatus, 'approved' | 'rejected'>,
    reason?: string,
  ) => Promise<string | null>;
  setInsuranceStatus: (
    policyId: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ) => Promise<string | null>;
  setOrderStatus: (id: string, status: OrderStatus) => Promise<string | null>;
  cancelOrder: (id: string, reason: string) => Promise<string | null>;
  saveMedicine: (input: MedicineInput) => Promise<string | null>;
  setMedicineActive: (id: string, active: boolean) => Promise<string | null>;
  toggleNurseAccepting: (id: string) => Promise<string | null>;
  setNurseSuspended: (id: string, suspended: boolean) => Promise<string | null>;
};

const StoreContext = createContext<StoreApi | null>(null);

function slugifyMedicineId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'medicine';
}

function descriptionList(raw: string): string[] {
  const parts = raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [];
}

async function uploadMedicineImage(medicineId: string, file: File): Promise<string> {
  const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
  const path = `${medicineId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('medicine-images').upload(path, file, {
    contentType: file.type || `image/${ext}`,
    upsert: true,
  });
  if (error) throw new Error(error.message || 'Could not upload image.');
  const { data } = supabase.storage.from('medicine-images').getPublicUrl(path);
  return data.publicUrl;
}

function formatDob(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function docLabel(docType: string): string {
  if (docType === 'id_front') return 'ID front';
  if (docType === 'id_back') return 'ID back';
  if (docType === 'nurse_license') return 'Nursing license';
  if (docType === 'insurance_front') return 'Card front';
  if (docType === 'insurance_back') return 'Card back';
  return docType.replaceAll('_', ' ');
}

function relevantDocs(role: string, docs: { doc_type?: string; file_url?: string }[]): { docType: string; path: string }[] {
  const wanted = role === 'nurse' ? ['nurse_license'] : ['id_front', 'id_back'];
  return docs
    .filter((d) => d.doc_type && d.file_url && wanted.includes(d.doc_type))
    .map((d) => ({ docType: d.doc_type as string, path: d.file_url as string }));
}

async function signedUrlMap(bucket: string, paths: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const map = new Map<string, string | null>();
  if (unique.length === 0) return map;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, 60 * 60);
  if (error) {
    unique.forEach((p) => map.set(p, null));
    return map;
  }
  for (const row of data ?? []) {
    const path = (row as { path?: string }).path ?? '';
    map.set(path, row.signedUrl ?? null);
  }
  // createSignedUrls sometimes omits path — zip by index
  unique.forEach((path, i) => {
    if (!map.has(path)) map.set(path, data?.[i]?.signedUrl ?? null);
  });
  return map;
}

function insuranceDocs(docs: { doc_type?: string; file_url?: string }[]): { docType: string; path: string }[] {
  const wanted = ['insurance_front', 'insurance_back'];
  return docs
    .filter((d) => d.doc_type && d.file_url && wanted.includes(d.doc_type))
    .map((d) => ({ docType: d.doc_type as string, path: d.file_url as string }));
}

function providerLabel(provider: string, other: string | null): string {
  if (provider === 'Other') return other?.trim() || 'Other';
  return provider;
}

function mapInsuranceReview(
  row: Record<string, unknown>,
  docsByProfile: Map<string, { doc_type?: string; file_url?: string }[]>,
  urls: Map<string, string | null>,
): InsuranceReview {
  const patient = first(
    row.patient as OneOrMany<{
      full_name?: string | null;
      phone?: string | null;
      email?: string | null;
    }>,
  );
  const profileId = String(row.profile_id);
  const docs: ReviewDoc[] = insuranceDocs(docsByProfile.get(profileId) ?? []).map((d) => ({
    docType: d.docType,
    label: docLabel(d.docType),
    path: d.path,
    signedUrl: urls.get(d.path) ?? null,
  }));
  return {
    id: String(row.id),
    profileId,
    name: patient?.full_name || 'Patient',
    phone: patient?.phone || '—',
    email: patient?.email || '—',
    provider: providerLabel(String(row.provider ?? ''), (row.provider_other as string | null) ?? null),
    policyNumber: String(row.policy_number ?? '—'),
    docs,
  };
}

function mapIdReview(row: Record<string, unknown>, urls: Map<string, string | null>): IdReview {
  const role = row.role === 'nurse' ? 'nurse' : 'patient';
  const addresses = row.addresses as OneOrMany<{ area_label?: string | null; is_primary?: boolean; line?: string | null; label?: string | null }>;
  const list = !addresses ? [] : Array.isArray(addresses) ? addresses : [addresses];
  const primary = list.find((a) => a.is_primary) ?? list[0];
  const address = primary
    ? [primary.line, primary.area_label || primary.label].filter(Boolean).join(', ') || null
    : null;
  const np = first(
    row.nurse_profiles as OneOrMany<{ specialty?: string | null; license_number?: string | null; credentials_label?: string | null }>,
  );
  const rawDocs = row.verification_documents as OneOrMany<{ doc_type?: string; file_url?: string }>;
  const docList = !rawDocs ? [] : Array.isArray(rawDocs) ? rawDocs : [rawDocs];
  const docs: ReviewDoc[] = relevantDocs(role, docList).map((d) => ({
    docType: d.docType,
    label: docLabel(d.docType),
    path: d.path,
    signedUrl: urls.get(d.path) ?? null,
  }));
  return {
    id: String(row.id),
    role,
    name: (row.full_name as string | null) || (role === 'nurse' ? 'Nurse' : 'Patient'),
    phone: (row.phone as string | null) || '—',
    email: (row.email as string | null) || '—',
    dob: formatDob((row.dob as string | null) ?? null),
    cnic: (row.cnic_number as string | null) || null,
    address,
    specialty: np?.specialty || np?.credentials_label || null,
    license: np?.license_number || null,
    docs,
  };
}

function mapNurseReview(row: Record<string, unknown>): NurseReview {
  const nurse = first(row.nurse as OneOrMany<{ full_name?: string | null }>);
  const visit = first(
    row.visit as OneOrMany<{
      public_code?: string | null;
      service?: OneOrMany<{ title?: string | null }>;
    }>,
  );
  const service = first(visit?.service ?? null);
  const visitId = String(row.visit_request_id ?? '');
  const rating = Math.min(5, Math.max(1, Math.round(Number(row.rating ?? 1))));
  return {
    id: String(row.id),
    nurseId: String(row.nurse_id ?? ''),
    nurseName: nurse?.full_name?.trim() || 'Nurse',
    rating,
    comment: ((row.comment as string | null) ?? '').trim() || null,
    visitId,
    visitCode: String(visit?.public_code ?? visitId).slice(0, 12),
    visitService: service?.title?.trim() || 'Visit',
    createdAt: String(row.created_at ?? ''),
  };
}

async function fetchLive(): Promise<LiveState> {
  const [nursesRes, patientsRes, visitsRes, ordersRes, medicinesRes, adminsRes, reviewsRes, insuranceRes, nurseReviewsRes] =
    await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, full_name, phone, email, created_at, account_status, nurse_profiles (specialty, license_number, is_accepting_jobs, credentials_label)',
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
        cancellation_reason, cancelled_by,
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
        id, public_code, status, subtotal_pkr, tax_pkr, total_pkr, created_at,
        cancellation_reason, cancelled_by, prescription_path, patient_id,
        patient:profiles!orders_patient_id_fkey (full_name, phone),
        delivery:addresses!orders_delivery_address_id_fkey (label, line, area_label, notes),
        order_items (qty, unit_price_pkr, medicines (name))
      `,
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('medicines')
      .select(
        'id, name, subtitle, price_pkr, category, rx_required, available, stock_qty, description, how_to_use, safety_tags, image_url, active',
      )
      .order('active', { ascending: false })
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'admin')
      .order('created_at'),
    supabase
      .from('profiles')
      .select(
        `
        id, role, full_name, phone, email, dob, cnic_number,
        addresses (line, area_label, label, is_primary),
        nurse_profiles (specialty, license_number, credentials_label),
        verification_documents (doc_type, file_url, status)
      `,
      )
      .eq('verification_status', 'under_review')
      .in('role', ['patient', 'nurse'])
      .order('created_at', { ascending: false }),
    supabase
      .from('insurance_policies')
      .select(
        `
        id, profile_id, provider, provider_other, policy_number, created_at,
        patient:profiles!insurance_policies_profile_id_fkey (full_name, phone, email)
      `,
      )
      .eq('status', 'under_review')
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select(
        `
        id, rating, comment, created_at, visit_request_id, nurse_id,
        nurse:profiles!reviews_nurse_id_fkey (full_name),
        visit:visit_requests!reviews_visit_request_id_fkey (
          public_code,
          service:services (title)
        )
      `,
      )
      .order('rating', { ascending: true })
      .order('created_at', { ascending: false }),
  ]);

  const firstError =
    nursesRes.error?.message ||
    patientsRes.error?.message ||
    visitsRes.error?.message ||
    ordersRes.error?.message ||
    medicinesRes.error?.message ||
    adminsRes.error?.message ||
    reviewsRes.error?.message ||
    insuranceRes.error?.message ||
    nurseReviewsRes.error?.message;
  if (firstError) throw new Error(firstError);

  const reviewRows = (reviewsRes.data ?? []) as Record<string, unknown>[];
  const insuranceRows = (insuranceRes.data ?? []) as Record<string, unknown>[];
  const insuranceProfileIds = insuranceRows.map((row) => String(row.profile_id)).filter(Boolean);
  const insuranceDocsRes =
    insuranceProfileIds.length === 0
      ? { data: [] as { profile_id: string; doc_type?: string; file_url?: string }[], error: null }
      : await supabase
          .from('verification_documents')
          .select('profile_id, doc_type, file_url')
          .in('profile_id', insuranceProfileIds)
          .in('doc_type', ['insurance_front', 'insurance_back']);
  if (insuranceDocsRes.error) throw new Error(insuranceDocsRes.error.message);

  const docsByProfile = new Map<string, { doc_type?: string; file_url?: string }[]>();
  for (const doc of insuranceDocsRes.data ?? []) {
    const list = docsByProfile.get(doc.profile_id) ?? [];
    list.push(doc);
    docsByProfile.set(doc.profile_id, list);
  }

  const paths: string[] = [];
  for (const row of reviewRows) {
    const role = row.role === 'nurse' ? 'nurse' : 'patient';
    const rawDocs = row.verification_documents as OneOrMany<{ doc_type?: string; file_url?: string }>;
    const docList = !rawDocs ? [] : Array.isArray(rawDocs) ? rawDocs : [rawDocs];
    for (const d of relevantDocs(role, docList)) paths.push(d.path);
  }
  for (const list of docsByProfile.values()) {
    for (const d of insuranceDocs(list)) paths.push(d.path);
  }
  const orderRows = (ordersRes.data ?? []) as Record<string, unknown>[];
  const rxPaths = orderRows
    .map((row) => ((row.prescription_path as string | null) ?? '').trim())
    .filter(Boolean);
  const [urls, rxUrls] = await Promise.all([
    signedUrlMap('verification-docs', paths),
    signedUrlMap('prescriptions', rxPaths),
  ]);

  return {
    nurses: (nursesRes.data ?? []).map((row: Record<string, unknown>) => mapNurse(row)),
    patients: (patientsRes.data ?? []).map((row: Record<string, unknown>) => mapPatient(row)),
    visits: (visitsRes.data ?? []).map((row: Record<string, unknown>) => mapVisit(row)),
    orders: orderRows.map((row) => mapOrder(row, rxUrls)),
    medicines: (medicinesRes.data ?? []).map((row: Record<string, unknown>) => mapMedicine(row)),
    admins: (adminsRes.data ?? []).map((row: Record<string, unknown>) => mapAdmin(row)),
    idReviews: reviewRows.map((row) => mapIdReview(row, urls)),
    insuranceReviews: insuranceRows.map((row) => mapInsuranceReview(row, docsByProfile, urls)),
    nurseReviews: ((nurseReviewsRes.data ?? []) as Record<string, unknown>[])
      .map(mapNurseReview)
      .sort((a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt)),
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
        const visit = data.visits.find((v) => v.id === id);
        if (visit?.status === 'cancelled') return 'This visit is cancelled.';
        if (visit?.status === 'completed') return 'This visit is already completed.';
        const nurse = data.nurses.find((n) => n.id === nurseId);
        if (nurse?.suspended) return 'This nurse is suspended and cannot be assigned jobs.';
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
        if (status === 'cancelled') {
          return 'Use Cancel with a reason to cancel this visit.';
        }
        const visit = data.visits.find((v) => v.id === id);
        if (visit?.status === 'cancelled') return 'This visit is cancelled.';
        if (visit?.status === 'completed') return 'This visit is already completed.';
        const { error: updateError } = await supabase.from('visit_requests').update({ status }).eq('id', id);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      cancelVisit: async (id, reason) => {
        const trimmed = reason.trim();
        if (!trimmed) return 'Add a cancellation reason.';
        const { error: updateError } = await supabase
          .from('visit_requests')
          .update({ status: 'cancelled', cancellation_reason: trimmed })
          .eq('id', id)
          .neq('status', 'cancelled')
          .neq('status', 'completed');
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      setVerification: async (profileId, status, reason) => {
        const row = data.idReviews.find((r) => r.id === profileId);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_status: status,
            verification_rejection_reason:
              status === 'rejected' ? reason?.trim() || null : null,
          })
          .eq('id', profileId);
        if (updateError) return updateError.message;

        const docTypes = row?.role === 'nurse' ? ['nurse_license'] : ['id_front', 'id_back'];
        await supabase
          .from('verification_documents')
          .update({ status })
          .eq('profile_id', profileId)
          .in('doc_type', docTypes);

        await refresh();
        return null;
      },
      setInsuranceStatus: async (policyId, status, reason) => {
        const row = data.insuranceReviews.find((r) => r.id === policyId);
        const { error: updateError } = await supabase
          .from('insurance_policies')
          .update({
            status,
            rejection_reason: status === 'rejected' ? reason?.trim() || null : null,
          })
          .eq('id', policyId)
          .eq('status', 'under_review');
        if (updateError) return updateError.message;

        if (row?.profileId) {
          await supabase
            .from('verification_documents')
            .update({ status })
            .eq('profile_id', row.profileId)
            .in('doc_type', ['insurance_front', 'insurance_back']);
        }

        await refresh();
        return null;
      },
      setOrderStatus: async (id, status) => {
        if (status === 'cancelled') {
          return 'Use Cancel with a reason to cancel this order.';
        }
        const order = data.orders.find((o) => o.id === id);
        if (order?.status === 'cancelled') return 'This order is cancelled.';
        if (order?.status === 'delivered') return 'This order is already delivered.';
        const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', id);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      cancelOrder: async (id, reason) => {
        const trimmed = reason.trim();
        if (!trimmed) return 'Add a cancellation reason.';
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'cancelled', cancellation_reason: trimmed })
          .eq('id', id)
          .neq('status', 'cancelled')
          .neq('status', 'delivered');
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      saveMedicine: async (input) => {
        const name = input.name.trim();
        if (!name) return 'Add a medicine name.';
        const price = Number(input.pricePkr);
        if (!Number.isFinite(price) || price < 0) return 'Enter a valid price.';

        const stock = Math.round(Number(input.stockQty));
        if (!Number.isFinite(stock) || stock < 0) return 'Enter a stock count of 0 or more.';

        let id = input.id?.trim() || slugifyMedicineId(name);
        if (!input.id) {
          const taken = data.medicines.some((m) => m.id === id);
          if (taken) id = `${id}-${Date.now().toString(36).slice(-4)}`;
        }

        let imageUrl: string | undefined;
        if (input.imageFile) {
          try {
            imageUrl = await uploadMedicineImage(id, input.imageFile);
          } catch (e) {
            return e instanceof Error ? e.message : 'Could not upload image.';
          }
        }

        const description = descriptionList(input.description);
        const howToUse = input.howToUse
          .map((step) => ({ title: step.title.trim(), body: step.body.trim() }))
          .filter((step) => step.title || step.body);
        const safetyTags = input.safetyTags.map((tag) => tag.trim()).filter(Boolean);
        const payload: Record<string, unknown> = {
          name,
          subtitle: input.subtitle.trim(),
          price_pkr: price,
          category: input.category,
          rx_required: input.rxRequired,
          stock_qty: stock,
          description,
          how_to_use: howToUse,
          safety_tags: safetyTags,
        };
        if (imageUrl) {
          payload.image_url = imageUrl;
          payload.image_urls = [imageUrl];
        }

        const { error: writeError } = input.id
          ? await supabase.from('medicines').update(payload).eq('id', id)
          : await supabase.from('medicines').insert({ id, ...payload });
        if (writeError) return writeError.message;
        await refresh();
        return null;
      },
      setMedicineActive: async (id, active) => {
        const { error: updateError } = await supabase.from('medicines').update({ active }).eq('id', id);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      toggleNurseAccepting: async (id) => {
        const nurse = data.nurses.find((n) => n.id === id);
        if (nurse?.suspended) return 'Reactivate this nurse before changing duty status.';
        const { error: updateError } = await supabase
          .from('nurse_profiles')
          .update({ is_accepting_jobs: !(nurse?.accepting ?? true) })
          .eq('profile_id', id);
        if (updateError) return updateError.message;
        await refresh();
        return null;
      },
      setNurseSuspended: async (id, suspended) => {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ account_status: suspended ? 'suspended' : 'active' })
          .eq('id', id)
          .eq('role', 'nurse');
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
