import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, EmptyState } from '@/components/ui';
import { paths } from '@/lib/paths';
import { useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function StaffPage() {
  const { nurses, visits, toggleNurseAccepting, setNurseSuspended } = useStore();
  const [params] = useSearchParams();
  const focusId = params.get('nurse');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) return;
    document.getElementById(`staff-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, nurses]);

  const run = async (id: string, fn: () => Promise<string | null>) => {
    setBusyId(id);
    setActionError(null);
    const error = await fn();
    setBusyId(null);
    if (error) setActionError(error);
  };

  const suspend = (id: string, name: string, currentlySuspended: boolean) => {
    const ok = currentlySuspended
      ? window.confirm(`Reactivate ${name}? They will see the job board again.`)
      : window.confirm(
          `Suspend ${name}? They will be locked out of the app and cannot accept or be assigned new jobs. This is not the same as marking them off duty.`,
        );
    if (!ok) return;
    void run(id, () => setNurseSuspended(id, !currentlySuspended));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">People</div>
          <h2>Staff roster</h2>
          <p>
            Off duty only hides them from new work for a shift. Suspend locks the account until you
            reactivate it.
          </p>
        </div>
      </div>
      {actionError ? <div className="banner-error">{actionError}</div> : null}
      {nurses.length === 0 ? (
        <div className="card">
          <EmptyState title="No nurses yet" body="When a nurse finishes onboarding in the app, they show up here." />
        </div>
      ) : (
        <div className="grid-3">
          {nurses.map((n) => {
            const loadVisits = visits.filter((v) => v.nurseId === n.id && !['completed', 'cancelled'].includes(v.status));
            const load = loadVisits.length;
            return (
              <div
                className={`card stack staff-card${focusId === n.id ? ' is-selected' : ''}`}
                key={n.id}
                id={`staff-${n.id}`}
              >
                <div className="staff-top">
                  <Avatar name={n.name} size={52} tone={n.suspended ? 'warm' : n.accepting ? 'care' : 'warm'} />
                  <div>
                    <h3>{n.name}</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      {n.specialty}
                    </p>
                  </div>
                </div>
                <div className="muted">
                  License {n.license}
                  <br />
                  {n.phone}
                  <br />
                  {n.email}
                </div>
                <div className="row">
                  <span className="chip pending">{load} active</span>
                  {n.suspended ? (
                    <span className="chip cancelled">Suspended</span>
                  ) : (
                    <span className={`chip ${n.accepting ? 'approved' : 'cancelled'}`}>
                      {n.accepting ? 'Accepting' : 'Off duty'}
                    </span>
                  )}
                </div>
                {loadVisits.length > 0 ? (
                  <ul className="jump-list">
                    {loadVisits.map((v) => (
                      <li key={v.id}>
                        <Link to={paths.visit(v.id)}>
                          <span className="mono">{v.code}</span>
                          <span>{v.service}</span>
                          <span className={`chip ${chipClass(v.status)}`}>{v.status.replaceAll('_', ' ')}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <button
                  className="btn btn-ghost"
                  disabled={busyId === n.id || n.suspended}
                  onClick={() => void run(n.id, () => toggleNurseAccepting(n.id))}
                >
                  {n.accepting ? 'Mark off duty' : 'Mark accepting jobs'}
                </button>
                <button
                  className={n.suspended ? 'btn btn-care' : 'btn btn-danger'}
                  disabled={busyId === n.id}
                  onClick={() => suspend(n.id, n.name, n.suspended)}
                >
                  {n.suspended ? 'Reactivate' : 'Suspend'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
