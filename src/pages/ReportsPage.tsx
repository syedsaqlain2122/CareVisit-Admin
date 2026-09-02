import { EmptyState, KpiCard } from '@/components/ui';
import { money, useStore } from '@/lib/store';

export function ReportsPage() {
  const { visits, patients, orders, nurses } = useStore();
  const completed = visits.filter((v) => v.status === 'completed');
  const cancelled = visits.filter((v) => v.status === 'cancelled');
  const approved = patients.filter((p) => p.verification === 'approved').length;
  const total = Math.max(visits.length, 1);

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
        <KpiCard label="Completed visits" value={completed.length} tone="care" />
        <KpiCard label="Cancelled" value={cancelled.length} tone="warm" />
        <KpiCard label="Verified patients" value={approved} tone="primary" />
        <KpiCard label="Nurses rostered" value={nurses.length} tone="deep" />
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
              {money(orders.reduce((s, o) => s + o.totalPkr, 0))}
            </p>
          </div>
          <p className="muted">{orders.length} orders in this workspace</p>
        </div>
      </div>
    </>
  );
}
