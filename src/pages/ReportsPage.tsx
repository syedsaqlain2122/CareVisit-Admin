import { money, useStore } from '@/lib/store';

export function ReportsPage() {
  const { visits, patients, orders, nurses } = useStore();
  const completed = visits.filter((v) => v.status === 'completed');
  const cancelled = visits.filter((v) => v.status === 'cancelled');
  const approved = patients.filter((p) => p.verification === 'approved').length;

  const byService = visits.reduce<Record<string, number>>((acc, v) => {
    acc[v.service] = (acc[v.service] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Reports</h2>
          <p>Simple ops snapshot for CareVisit. Live GPS map is out of scope for v1 — status tracking only.</p>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card kpi">
          <div className="label">Completed visits</div>
          <div className="value">{completed.length}</div>
        </div>
        <div className="card kpi">
          <div className="label">Cancelled</div>
          <div className="value">{cancelled.length}</div>
        </div>
        <div className="card kpi">
          <div className="label">Verified patients</div>
          <div className="value">{approved}</div>
        </div>
        <div className="card kpi">
          <div className="label">Nurses rostered</div>
          <div className="value">{nurses.length}</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Volume by service</h3>
          {Object.entries(byService).map(([name, count]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{name}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pharmacy GMV</h3>
          <p className="display" style={{ fontSize: 32, margin: 0 }}>
            {money(orders.reduce((s, o) => s + o.totalPkr, 0))}
          </p>
          <p className="muted">{orders.length} orders in this workspace</p>
        </div>
      </div>
    </>
  );
}
