export type VisitStatus =
  | 'pending'
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VerificationStatus = 'unverified' | 'under_review' | 'approved' | 'rejected';

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
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
  rating: number;
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
  patientName: string;
  items: string;
  totalPkr: number;
  status: 'pending' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment: 'cod_unpaid' | 'cod_collected';
  createdAt: string;
};

export type StoreState = {
  admins: AdminAccount[];
  sessionEmail: string | null;
  nurses: Nurse[];
  patients: Patient[];
  visits: VisitRequest[];
  orders: PharmacyOrder[];
};
