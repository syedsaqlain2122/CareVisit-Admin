import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export type OpsAlertKind = 'visit' | 'order' | 'id_review' | 'insurance';

export type OpsAlert = {
  id: string;
  kind: OpsAlertKind;
  title: string;
  body: string;
  href: string;
  createdAt: number;
};

export type RealtimeStatus = 'off' | 'connecting' | 'live' | 'error';

const STORAGE_KEY = 'carevisit.admin.opsAlerts';
const TOAST_MS = 8000;

type ChangePayload = {
  eventType?: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
};

function loadStored(): OpsAlert[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OpsAlert[];
    return Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.id === 'string') : [];
  } catch {
    return [];
  }
}

function saveStored(alerts: OpsAlert[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, 50)));
  } catch {
    /* ignore quota */
  }
}

function becameUnderReview(next: unknown, prev: unknown) {
  return next === 'under_review' && prev !== 'under_review';
}

function asAlert(kind: OpsAlertKind, rowId: string, title: string, body: string, href: string): OpsAlert {
  return {
    id: `${kind}:${rowId}`,
    kind,
    title,
    body,
    href,
    createdAt: Date.now(),
  };
}

function fromVisit(row: Record<string, unknown> | undefined): OpsAlert | null {
  const id = String(row?.id ?? '');
  if (!id) return null;
  const code = String(row?.public_code ?? '').trim();
  return asAlert(
    'visit',
    id,
    'New visit request',
    code ? `${code} just landed in the queue.` : 'A patient booked a home visit.',
    `/requests?visit=${id}`,
  );
}

function fromOrder(row: Record<string, unknown> | undefined): OpsAlert | null {
  const id = String(row?.id ?? '');
  if (!id) return null;
  const code = String(row?.public_code ?? '').trim();
  return asAlert(
    'order',
    id,
    'New pharmacy order',
    code ? `${code} is waiting to be dispatched.` : 'A patient placed a medicine order.',
    `/pharmacy?order=${id}`,
  );
}

function fromProfile(row: Record<string, unknown> | undefined): OpsAlert | null {
  const id = String(row?.id ?? '');
  if (!id) return null;
  const name = String(row?.full_name ?? '').trim() || 'Someone';
  const role = row?.role === 'nurse' ? 'nurse license' : 'ID';
  return asAlert('id_review', id, 'ID ready for review', `${name} submitted ${role} documents.`, `/verification?profile=${id}`);
}

function fromInsurance(row: Record<string, unknown> | undefined): OpsAlert | null {
  const id = String(row?.id ?? '');
  if (!id) return null;
  const provider = String(row?.provider_other ?? row?.provider ?? '').trim() || 'Insurance';
  return asAlert(
    'insurance',
    id,
    'Insurance ready for review',
    `${provider} policy submitted for verification.`,
    `/insurance?policy=${id}`,
  );
}

export function useOpsAlerts(enabled: boolean, onChange: () => void) {
  const [alerts, setAlerts] = useState<OpsAlert[]>(() => (enabled ? loadStored() : []));
  const [toasts, setToasts] = useState<string[]>([]);
  const [status, setStatus] = useState<RealtimeStatus>('off');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const toastTimers = useRef<Map<string, number>>(new Map());
  const refreshTimer = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setAlerts([]);
      setToasts([]);
      setStatus('off');
      return;
    }
    setAlerts(loadStored());
  }, [enabled]);

  const pushAlert = useCallback((alert: OpsAlert | null) => {
    if (!alert) return;
    setAlerts((prev) => {
      const next = [alert, ...prev.filter((a) => a.id !== alert.id)].slice(0, 50);
      saveStored(next);
      return next;
    });
    setToasts((prev) => [alert.id, ...prev.filter((id) => id !== alert.id)].slice(0, 4));
    const existing = toastTimers.current.get(alert.id);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((id) => id !== alert.id));
      toastTimers.current.delete(alert.id);
    }, TOAST_MS);
    toastTimers.current.set(alert.id, timer);
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => onChangeRef.current(), 250);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    setStatus('connecting');
    const channel = supabase
      .channel('admin-ops-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visit_requests' },
        (payload: ChangePayload) => pushAlert(fromVisit(payload.new)),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: ChangePayload) => pushAlert(fromOrder(payload.new)),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: ChangePayload) => {
          if (!becameUnderReview(payload.new?.verification_status, payload.old?.verification_status)) return;
          pushAlert(fromProfile(payload.new));
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insurance_policies' },
        (payload: ChangePayload) => {
          if (!becameUnderReview(payload.new?.status, payload.old?.status)) return;
          pushAlert(fromInsurance(payload.new));
        },
      )
      .subscribe((next) => {
        if (next === 'SUBSCRIBED') setStatus('live');
        else if (next === 'CHANNEL_ERROR' || next === 'TIMED_OUT') setStatus('error');
        else if (next === 'CLOSED') setStatus('off');
        else setStatus('connecting');
      });

    return () => {
      toastTimers.current.forEach((id) => window.clearTimeout(id));
      toastTimers.current.clear();
      window.clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [enabled, pushAlert]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveStored(next);
      return next;
    });
    setToasts((prev) => prev.filter((toastId) => toastId !== id));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toastId) => toastId !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
    setToasts([]);
    saveStored([]);
  }, []);

  const visibleToasts = toasts
    .map((id) => alerts.find((a) => a.id === id))
    .filter((a): a is OpsAlert => Boolean(a));

  return {
    alerts,
    toasts: visibleToasts,
    unhandledCount: alerts.length,
    status,
    dismissAlert,
    dismissToast,
    clearAll,
  };
}
