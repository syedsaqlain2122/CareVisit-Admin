import { Link } from 'react-router-dom';
import { money, nurseName, useStore } from '@/lib/store';
import { chipClass, isQueuedVisit } from '@/lib/types';

export function DashboardPage() {
  const { visits, patients, orders, nurses, currentAdmin } = useStore();
  const pending = visits.filter((v) => isQueuedVisit(v.status)).length;
  const live = visits.filter((v) => ['assigned', 'on_the_way', 'arrived', 'in_progress'].includes(v.status)).length;
  const review = patients.filter((p) => p.verification === 'under_review').length;
  const cod = orders.filter((o) => o.payment === 'cod_unpaid').reduce((s, o) => s + o.totalPkr, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Overview</h2>
          <p>Hello, {currentAdmin?.name.split(' ')[0]}. Live queue from the CareVisit app — cash on delivery only.</p>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 18 }}>
        <div className="card kpi">
          <div className="label">Pending requests</div>
          <div className="value">{pending}</div>
        </div>
        <div className="card kpi">
          <div className="label">Live visits</div>
          <div className="value">{live}</div>
        </div>
        <div className="card kpi">
          <div className="label">IDs to review</div>
          <div className="value">{review}</div>
        </div>
        <div className="card kpi">
          <div className="label">COD outstanding</div>
          <div className="value">{money(cod)}</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Request queue</h3>
            <Link to="/requests">Open queue</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 5).map((v) => (
                  <tr key={v.id}>
                    <td>{v.code}</td>
                    <td>{v.patientName}</td>
                    <td>{v.service}</td>
                    <td>
                      <span className={`chip ${chipClass(v.status)}`}>{v.status.replaceAll('_', ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visits.length === 0 ? <p className="muted">No visit requests yet.</p> : null}
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Nurses on shift</h3>
            <Link to="/staff">Roster</Link>
          </div>
          {nurses.length === 0 ? <p className="muted">No nurses on the roster yet.</p> : null}
          {nurses.map((n) => (
            <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong>{n.name}</strong>
                <div className="muted">{n.specialty}</div>
              </div>
              <span className={`chip ${n.accepting ? 'approved' : 'cancelled'}`}>{n.accepting ? 'Accepting' : 'Off'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Today’s assignments</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Visit</th>
                <th>Nurse</th>
                <th>Window</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {visits
                .filter((v) => v.nurseId)
                .map((v) => (
                  <tr key={v.id}>
                    <td>
                      {v.patientName} · {v.service}
                    </td>
                    <td>{nurseName(nurses, v.nurseId)}</td>
                    <td>{v.windowStart ? `${v.windowStart}–${v.windowEnd}` : '—'}</td>
                    <td>{money(v.feePkr)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {visits.every((v) => !v.nurseId) ? <p className="muted">No assigned visits yet.</p> : null}
        </div>
      </div>
    </>
  );
}
