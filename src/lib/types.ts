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
};

export type PharmacyOrder = {
  id: string;
  code: string;
  patientName: string;
  items: string;
  totalPkr: number;
  status: OrderStatus;
  payment: 'cod_unpaid' | 'cod_collected';
  createdAt: string;
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
