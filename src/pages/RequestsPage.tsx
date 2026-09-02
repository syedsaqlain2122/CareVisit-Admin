import { FormEvent, useEffect, useMemo, useState } from 'react';
import { EmptyState, PersonCell } from '@/components/ui';
import { money, nurseName, useStore } from '@/lib/store';
import { chipClass, isQueuedVisit, VISIT_STATUSES, type VisitRequest, type VisitStatus } from '@/lib/types';

export function RequestsPage() {
  const { visits, nurses, assignVisit, setVisitStatus } = useStore();
  const [filter, setFilter] = useState<'all' | VisitStatus>('all');
  const [selected, setSelected] = useState<VisitRequest | null>(null);
  const [nurseId, setNurseId] = useState('');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('12:00');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelected((prev) => {
      return (
        (prev ? visits.find((v) => v.id === prev.id) : null) ??
        visits.find((v) => isQueuedVisit(v.status)) ??
        visits[0] ??
        null
      );
    });
  }, [visits]);

  useEffect(() => {
    setNurseId((prev) => prev || nurses.find((n) => n.accepting)?.id || nurses[0]?.id || '');
  }, [nurses]);

  const rows = useMemo(
    () => (filter === 'all' ? visits : visits.filter((v) => v.status === filter)),
    [visits, filter],
  );

  const onAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !nurseId) return;
    const err = await assignVisit(selected.id, nurseId, start, end);
    setMessage(err);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Queue</div>
          <h2>Visit queue</h2>
          <p>Triage incoming home-care requests, assign a nurse, and set a time window. COD only.</p>
        </div>
      </div>
      <div className="pills" style={{ marginBottom: 16 }}>
        <button type="button" className={`pill${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        {VISIT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`pill${filter === s ? ' on' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
      <div className="grid-2">
        <div className="card card-flush table-wrap">
          {rows.length === 0 ? (
            <EmptyState title="Nothing in this filter" body="New bookings from the app appear here." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>When</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr
                    key={v.id}
                    className={selected?.id === v.id ? 'is-selected' : undefined}
                    onClick={() => {
                      setSelected(v);
                      if (v.nurseId) setNurseId(v.nurseId);
                      if (v.windowStart) setStart(v.windowStart);
                      if (v.windowEnd) setEnd(v.windowEnd);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="mono">{v.code}</td>
                    <td>
                      <PersonCell name={v.patientName} meta={v.service} />
                    </td>
                    <td>{v.preferredDate}</td>
                    <td>
                      <span className={`chip ${chipClass(v.status)}`}>{v.status.replaceAll('_', ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card stack assign-panel">
          {selected ? (
            <>
              <div>
                <div className="panel-kicker">Assign staff</div>
                <h3 style={{ margin: '6px 0 0', fontSize: 22 }}>
                  {selected.patientName}
                </h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  {selected.service} · {selected.address}
                  {selected.notes ? (
                    <>
                      <br />
                      {selected.notes}
                    </>
                  ) : null}
                  {selected.requiresRx ? ' · Prescription required' : ''}
                </p>
                <p>
                  <strong>{money(selected.feePkr)}</strong>
                  <span className="muted"> · {selected.durationDays} day(s) · pay nurse on arrival</span>
                </p>
              </div>
              <form className="stack" onSubmit={(e) => void onAssign(e)}>
                <div className="field">
                  <label>Nurse</label>
                  <select value={nurseId} onChange={(e) => setNurseId(e.target.value)}>
                    {nurses.length === 0 ? <option value="">No nurses yet</option> : null}
                    {nurses.map((n) => (
                      <option key={n.id} value={n.id} disabled={!n.accepting}>
                        {n.name} {n.accepting ? '' : '(off)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row">
                  <div className="field" style={{ flex: 1 }}>
                    <label>Window start</label>
                    <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Window end</label>
                    <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={!nurseId}>
                  Assign nurse
                </button>
              </form>
              <div className="field">
                <label>Advance status</label>
                <select
                  value={selected.status}
                  onChange={(e) => {
                    const status = e.target.value as VisitStatus;
                    void setVisitStatus(selected.id, status);
                  }}
                >
                  {VISIT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              {message ? <div className="error">{message}</div> : null}
              <p className="muted">Currently: {nurseName(nurses, selected.nurseId)}</p>
            </>
          ) : (
            <EmptyState title="Select a request" body="Choose a visit on the left to assign a nurse." />
          )}
        </div>
      </div>
    </>
  );
}
