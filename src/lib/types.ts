export type VisitStatus =
  | 'draft'
  | 'pending_review'
  | 'open'
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VerificationStatus = 'unverified' | 'under_review' | 'approved' | 'rejected';

export type OrderStatus = 'placed' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type MedicineCategory = 'pain' | 'antibiotics' | 'vitamins' | 'allergy' | 'first_aid';

export const MEDICINE_CATEGORIES: { key: MedicineCategory; label: string }[] = [
  { key: 'pain', label: 'Pain relief' },
  { key: 'antibiotics', label: 'Antibiotics' },
  { key: 'vitamins', label: 'Vitamins' },
  { key: 'allergy', label: 'Allergy' },
  { key: 'first_aid', label: 'First aid' },
];

export type CatalogMedicine = {
  id: string;
  name: string;
  subtitle: string;
  pricePkr: number;
  category: MedicineCategory;
  rxRequired: boolean;
  available: boolean;
  stockQty: number;
  description: string;
  imageUrl: string | null;
};

export type OrderLineItem = {
  name: string;
  qty: number;
  unitPricePkr: number;
};

export type MedicineInput = {
  id?: string;
  name: string;
  subtitle: string;
  pricePkr: number;
  category: MedicineCategory;
  description: string;
  rxRequired: boolean;
  stockQty: number;
  imageFile?: File | null;
};

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Nurse = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  license: string;
  accepting: boolean;
  /** profiles.account_status — not the off-duty toggle */
  suspended: boolean;
};

export type Patient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  cnic: string;
  verification: VerificationStatus;
  city: string;
};

export type ReviewDoc = {
  docType: 'id_front' | 'id_back' | 'nurse_license' | string;
  label: string;
  path: string;
  signedUrl: string | null;
};

export type IdReview = {
  id: string;
  role: 'patient' | 'nurse';
  name: string;
  phone: string;
  email: string;
  dob: string | null;
  cnic: string | null;
  address: string | null;
  specialty: string | null;
  license: string | null;
  docs: ReviewDoc[];
};

export type InsuranceReview = {
  id: string;
  profileId: string;
  name: string;
  phone: string;
  email: string;
  provider: string;
  policyNumber: string;
  docs: ReviewDoc[];
};

export type VisitRequest = {
  id: string;
  code: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  service: string;
  address: string;
  preferredDate: string;
  durationDays: number;
  feePkr: number;
  status: VisitStatus;
  nurseId: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  notes: string;
  requiresRx: boolean;
  createdAt: string;
  cancellationReason: string | null;
  cancelledBy: 'patient' | 'admin' | null;
};

export type PharmacyOrder = {
  id: string;
  code: string;
  patientName: string;
  patientPhone: string;
  items: string;
  lineItems: OrderLineItem[];
  subtotalPkr: number;
  taxPkr: number;
  totalPkr: number;
  status: OrderStatus;
  payment: 'cod_unpaid' | 'cod_collected';
  paymentMethod: 'Cash on delivery';
  addressLabel: string | null;
  addressLine: string | null;
  addressNotes: string | null;
  prescriptionPath: string | null;
  prescriptionUrl: string | null;
  createdAt: string;
  cancellationReason: string | null;
  cancelledBy: 'patient' | 'admin' | null;
};

export const VISIT_STATUSES: VisitStatus[] = [
  'open',
  'pending_review',
  'assigned',
  'on_the_way',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
];

export const VISIT_ADVANCE_STATUSES: VisitStatus[] = VISIT_STATUSES.filter(
  (status) => status !== 'cancelled',
);

export function isQueuedVisit(status: VisitStatus) {
  return status === 'open' || status === 'pending_review' || status === 'draft';
}

export function chipClass(status: string) {
  if (status === 'open' || status === 'draft' || status === 'pending_review' || status === 'placed') {
    return 'pending';
  }
  if (status === 'confirmed') return 'assigned';
  return status;
}

export function orderPayment(status: OrderStatus): PharmacyOrder['payment'] {
  return status === 'delivered' ? 'cod_collected' : 'cod_unpaid';
}
