import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, KpiCard, PersonCell } from '@/components/ui';
import { paths } from '@/lib/paths';
import { money, useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function ReportsPage() {
  const navigate = useNavigate();
  const { visits, patients, orders, nurses } = useStore();
  const completed = visits.filter((v) => v.status === 'completed');
  const cancelledVisits = visits.filter((v) => v.status === 'cancelled');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
  const approved = patients.filter((p) => p.verification === 'approved').length;
  const total = Math.max(visits.length, 1);
  const pharmacyGmv = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + o.totalPkr, 0);

  const byService = visits.reduce<Record<string, number>>((acc, v) => {
    acc[v.service] = (acc[v.service] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Snapshot</div>
          <h2>Reports</h2>
          <p>Ops snapshot from live CareVisit data. Live GPS map is out of scope for v1 — status tracking only.</p>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KpiCard label="Completed visits" value={completed.length} tone="care" to="/requests" />
        <KpiCard label="Cancelled visits" value={cancelledVisits.length} tone="warm" to="/requests" />
        <KpiCard label="Cancelled orders" value={cancelledOrders.length} tone="warm" to="/pharmacy" />
        <KpiCard label="Verified patients" value={approved} tone="primary" to="/patients" />
      </div>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Volume by service</h3>
          {Object.keys(byService).length === 0 ? (
            <EmptyState title="No visits yet" body="Service mix will fill in as patients book." />
          ) : (
            Object.entries(byService).map(([name, count]) => (
              <div key={name} className="bar-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.round((count / total) * 100)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginTop: 0 }}>Pharmacy GMV</h3>
            <p className="display" style={{ fontSize: 40, margin: '12px 0 0' }}>
              {money(pharmacyGmv)}
            </p>
          </div>
          <p className="muted">
            {orders.filter((o) => o.status !== 'cancelled').length} active orders · {nurses.length} nurses rostered
            {' · '}
            <Link to="/pharmacy">Open pharmacy</Link>
          </p>
        </div>
      </div>
      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card card-flush table-wrap">
          <h3 style={{ margin: '16px 16px 0' }}>Cancelled visits</h3>
          {cancelledVisits.length === 0 ? (
            <EmptyState title="No cancelled visits" body="Patient and admin cancellations will list here with a reason." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Visit</th>
                  <th>Patient</th>
                  <th>By</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {cancelledVisits.map((v) => (
                  <tr key={v.id} className="clickable" onClick={() => navigate(paths.visit(v.id))}>
                    <td className="mono">{v.code}</td>
                    <td>
                      <PersonCell name={v.patientName} meta={v.service} to={paths.patient(v.patientId)} />
                    </td>
                    <td>
                      <span className={`chip ${chipClass('cancelled')}`}>{v.cancelledBy ?? 'cancelled'}</span>
                    </td>
                    <td>{v.cancellationReason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card card-flush table-wrap">
          <h3 style={{ margin: '16px 16px 0' }}>Cancelled orders</h3>
          {cancelledOrders.length === 0 ? (
            <EmptyState title="No cancelled orders" body="Patient and admin cancellations will list here with a reason." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Patient</th>
                  <th>By</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {cancelledOrders.map((o) => (
                  <tr key={o.id} className="clickable" onClick={() => navigate(paths.order(o.id))}>
                    <td className="mono">{o.code}</td>
                    <td>
                      <PersonCell name={o.patientName} to={o.patientId ? paths.patient(o.patientId) : undefined} />
                    </td>
                    <td>
                      <span className={`chip ${chipClass('cancelled')}`}>{o.cancelledBy ?? 'cancelled'}</span>
                    </td>
                    <td>{o.cancellationReason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
