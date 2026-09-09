import { useNavigate } from 'react-router-dom';
import { EmptyState, KpiCard, PersonCell } from '@/components/ui';
import { paths } from '@/lib/paths';
import { money, useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function PaymentsPage() {
  const navigate = useNavigate();
  const { visits, orders } = useStore();
  const visitFees = visits.filter((v) => v.status !== 'cancelled').reduce((s, v) => s + v.feePkr, 0);
  const collected = orders.filter((o) => o.payment === 'cod_collected').reduce((s, o) => s + o.totalPkr, 0);
  const outstanding = orders
    .filter((o) => o.payment === 'cod_unpaid' && o.status !== 'cancelled')
    .reduce((s, o) => s + o.totalPkr, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Cash on delivery</div>
          <h2>Payments</h2>
          <p>v1 is cash on delivery only. Track visit fees and pharmacy COD collections — no card gateway.</p>
        </div>
      </div>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <KpiCard label="Visit fees (booked)" value={money(visitFees)} tone="primary" to="/requests" />
        <KpiCard label="Pharmacy COD collected" value={money(collected)} tone="care" to="/pharmacy" />
        <KpiCard label="Pharmacy COD outstanding" value={money(outstanding)} tone="warm" to="/pharmacy" />
      </div>
      <div className="card card-flush">
        {visits.length === 0 && orders.length === 0 ? (
          <EmptyState title="No payments yet" body="Visit fees and pharmacy COD will list here as jobs complete." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Party</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="clickable" onClick={() => navigate(paths.visit(v.id))}>
                    <td>Home visit {v.code}</td>
                    <td>
                      <PersonCell name={v.patientName} to={paths.patient(v.patientId)} />
                    </td>
                    <td className="mono">{money(v.feePkr)}</td>
                    <td>
                      <span
                        className={`chip ${
                          v.status === 'cancelled'
                            ? 'cancelled'
                            : v.status === 'completed'
                              ? 'completed'
                              : 'pending'
                        }`}
                      >
                        {v.status === 'cancelled'
                          ? 'cancelled'
                          : v.status === 'completed'
                            ? 'paid to nurse'
                            : 'due on arrival'}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.map((o) => (
                  <tr key={o.id} className="clickable" onClick={() => navigate(paths.order(o.id))}>
                    <td>Pharmacy {o.code}</td>
                    <td>
                      <PersonCell name={o.patientName} to={o.patientId ? paths.patient(o.patientId) : undefined} />
                    </td>
                    <td className="mono">{money(o.totalPkr)}</td>
                    <td>
                      <span className={`chip ${chipClass(o.status === 'cancelled' ? 'cancelled' : o.payment)}`}>
                        {o.status === 'cancelled' ? 'cancelled' : o.payment.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
