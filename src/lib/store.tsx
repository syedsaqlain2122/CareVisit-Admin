import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { SEED } from './seed';
import type {
  AdminAccount,
  PharmacyOrder,
  StoreState,
  VerificationStatus,
  VisitStatus,
} from './types';

const KEY = 'carevisit-admin-store-v1';

function load(): StoreState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw) as StoreState;
    if (!Array.isArray(parsed.admins) || parsed.admins.length === 0) {
      return { ...parsed, admins: structuredClone(SEED.admins) };
    }
    return parsed;
  } catch {
    return structuredClone(SEED);
  }
}

function persist(state: StoreState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

type StoreApi = StoreState & {
  currentAdmin: AdminAccount | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  addAdmin: (input: { name: string; email: string; password: string }) => string | null;
  removeAdmin: (id: string) => string | null;
  assignVisit: (id: string, nurseId: string, windowStart: string, windowEnd: string) => void;
  setVisitStatus: (id: string, status: VisitStatus) => void;
  setVerification: (patientId: string, status: VerificationStatus) => void;
  setOrderStatus: (id: string, status: PharmacyOrder['status'], payment?: PharmacyOrder['payment']) => void;
  toggleNurseAccepting: (id: string) => void;
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => load());

  const commit = (next: StoreState) => {
    persist(next);
    setState(next);
  };

  const api = useMemo<StoreApi>(() => {
    const currentAdmin = state.admins.find((a) => a.email === state.sessionEmail) ?? null;

    return {
      ...state,
      currentAdmin,
      login: (email, password) => {
        const match = state.admins.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
        );
        if (!match) return 'Email or password is incorrect.';
        commit({ ...state, sessionEmail: match.email });
        return null;
      },
      logout: () => commit({ ...state, sessionEmail: null }),
      addAdmin: ({ name, email, password }) => {
        const e = email.trim().toLowerCase();
        if (!name.trim() || !e || !password) return 'All fields are required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Enter a valid email.';
        if (password.length < 6) return 'Password must be at least 6 characters.';
        if (state.admins.some((a) => a.email.toLowerCase() === e)) return 'That email is already an admin.';
        commit({
          ...state,
          admins: [
            ...state.admins,
            {
              id: uid('admin'),
              name: name.trim(),
              email: e,
              password,
              createdAt: new Date().toISOString(),
            },
          ],
        });
        return null;
      },
      removeAdmin: (id) => {
        const target = state.admins.find((a) => a.id === id);
        if (!target) return 'Admin not found.';
        if (state.admins.length === 1) return 'Keep at least one admin account.';
        if (target.email === state.sessionEmail) return 'You cannot remove the signed-in account.';
        commit({ ...state, admins: state.admins.filter((a) => a.id !== id) });
        return null;
      },
      assignVisit: (id, nurseId, windowStart, windowEnd) => {
        commit({
          ...state,
          visits: state.visits.map((v) =>
            v.id === id
              ? { ...v, nurseId, windowStart, windowEnd, status: 'assigned' as VisitStatus }
              : v,
          ),
        });
      },
      setVisitStatus: (id, status) => {
        commit({
          ...state,
          visits: state.visits.map((v) => (v.id === id ? { ...v, status } : v)),
        });
      },
      setVerification: (patientId, status) => {
        commit({
          ...state,
          patients: state.patients.map((p) => (p.id === patientId ? { ...p, verification: status } : p)),
        });
      },
      setOrderStatus: (id, status, payment) => {
        commit({
          ...state,
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status, payment: payment ?? o.payment } : o,
          ),
        });
      },
      toggleNurseAccepting: (id) => {
        commit({
          ...state,
          nurses: state.nurses.map((n) => (n.id === id ? { ...n, accepting: !n.accepting } : n)),
        });
      },
    };
  }, [state]);

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
