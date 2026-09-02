import { FormEvent, useMemo, useState } from 'react';
import { money, nurseName, useStore } from '@/lib/store';
import type { VisitRequest, VisitStatus } from '@/lib/types';

const STATUSES: VisitStatus[] = [
  'pending',
  'assigned',
  'on_the_way',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
];

export function RequestsPage() {
  const { visits, nurses, assignVisit, setVisitStatus } = useStore();
  const [filter, setFilter] = useState<'all' | VisitStatus>('all');
  const [selected, setSelected] = useState<VisitRequest | null>(visits.find((v) => v.status === 'pending') ?? visits[0] ?? null);
  const [nurseId, setNurseId] = useState(nurses.find((n) => n.accepting)?.id ?? nurses[0]?.id ?? '');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('12:00');

  const rows = useMemo(
    () => (filter === 'all' ? visits : visits.filter((v) => v.status === filter)),
    [visits, filter],
  );

  const onAssign = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    assignVisit(selected.id, nurseId, start, end);
    setSelected({ ...selected, nurseId, windowStart: start, windowEnd: end, status: 'assigned' });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Visit queue</h2>
          <p>Triage incoming home-care requests, assign a nurse, and set a time window. COD only — no cards.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="grid-2">
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Service</th>
                <th>When</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => {
                    setSelected(v);
                    if (v.nurseId) setNurseId(v.nurseId);
                  }}
                  style={{ cursor: 'pointer', background: selected?.id === v.id ? '#eef2ff' : undefined }}
                >
                  <td>{v.id}</td>
                  <td>{v.patientName}</td>
                  <td>{v.service}</td>
                  <td>{v.preferredDate}</td>
                  <td>
                    <span className={`chip ${v.status}`}>{v.status.replaceAll('_', ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card stack">
          {selected ? (
            <>
              <div>
                <div className="muted">Assign staff</div>
                <h3 style={{ margin: '4px 0 0' }}>
                  {selected.patientName} · {selected.service}
                </h3>
                <p className="muted">
                  {selected.address}
                  <br />
                  {selected.notes}
                  {selected.requiresRx ? ' · Prescription required' : ''}
                </p>
                <p>
                  <strong>{money(selected.feePkr)}</strong> · {selected.durationDays} day(s) · pay nurse on arrival
                </p>
              </div>
              <form className="stack" onSubmit={onAssign}>
                <div className="field">
                  <label>Nurse</label>
                  <select value={nurseId} onChange={(e) => setNurseId(e.target.value)}>
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
                <button className="btn btn-primary" type="submit">
                  Assign nurse
                </button>
              </form>
              <div className="field">
                <label>Advance status</label>
                <select
                  value={selected.status}
                  onChange={(e) => {
                    const status = e.target.value as VisitStatus;
                    setVisitStatus(selected.id, status);
                    setSelected({ ...selected, status });
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <p className="muted">Currently: {nurseName(nurses, selected.nurseId)}</p>
            </>
          ) : (
            <p className="muted">Select a request from the queue.</p>
          )}
        </div>
      </div>
    </>
  );
}
