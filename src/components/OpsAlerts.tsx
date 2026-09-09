import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpsAlerts, type OpsAlert, type RealtimeStatus } from '@/lib/opsAlerts';

const KIND_LABEL: Record<OpsAlert['kind'], string> = {
  visit: 'Visit',
  order: 'Order',
  id_review: 'ID',
  insurance: 'Insurance',
};

export function OpsAlerts({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  const navigate = useNavigate();
  const { alerts, toasts, unhandledCount, status, dismissAlert, dismissToast, clearAll } = useOpsAlerts(
    enabled,
    onChange,
  );
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const jump = (alert: OpsAlert) => {
    dismissAlert(alert.id);
    setOpen(false);
    navigate(alert.href);
  };

  return (
    <>
      <div className="topbar-alerts" ref={wrapRef}>
        <RealtimePill status={status} />
        <button
          type="button"
          className={`bell-btn${open ? ' on' : ''}`}
          aria-label={unhandledCount ? `${unhandledCount} unhandled alerts` : 'Notifications'}
          onClick={() => setOpen((v) => !v)}
        >
          <BellIcon />
          {unhandledCount > 0 ? <span className="bell-count">{unhandledCount > 99 ? '99+' : unhandledCount}</span> : null}
        </button>
        {open ? (
          <div className="bell-panel">
            <div className="bell-head">
              <strong>Unhandled</strong>
              {unhandledCount > 0 ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>
                  Clear
                </button>
              ) : null}
            </div>
            {alerts.length === 0 ? (
              <p className="muted" style={{ margin: 0, padding: '8px 4px' }}>
                No new visits, orders, or reviews waiting.
              </p>
            ) : (
              <ul className="bell-list">
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    <button type="button" className="bell-item" onClick={() => jump(alert)}>
                      <span className="bell-kind">{KIND_LABEL[alert.kind]}</span>
                      <span className="bell-title">{alert.title}</span>
                      <span className="muted">{alert.body}</span>
                    </button>
                    <button
                      type="button"
                      className="bell-x"
                      aria-label="Dismiss"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
      <div className="toast-stack" aria-live="polite">
        {toasts.map((alert) => (
          <div key={alert.id} className="toast-card">
            <button type="button" className="toast-body" onClick={() => jump(alert)}>
              <span className="bell-kind">{KIND_LABEL[alert.kind]}</span>
              <strong>{alert.title}</strong>
              <span className="muted">{alert.body}</span>
            </button>
            <button type="button" className="toast-x" aria-label="Dismiss toast" onClick={() => dismissToast(alert.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function RealtimePill({ status }: { status: RealtimeStatus }) {
  const label =
    status === 'live' ? 'Realtime' : status === 'connecting' ? 'Connecting realtime' : status === 'error' ? 'Realtime offline' : 'Signed out';
  return (
    <span className={`live-pill${status === 'error' ? ' is-warn' : ''}${status === 'live' ? '' : ' is-muted'}`}>
      <span className="live-dot" />
      {label}
    </span>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
