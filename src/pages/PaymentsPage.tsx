import { money, useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function PaymentsPage() {
  const { visits, orders } = useStore();
  const visitFees = visits.filter((v) => v.status !== 'cancelled').reduce((s, v) => s + v.feePkr, 0);
  const collected = orders.filter((o) => o.payment === 'cod_collected').reduce((s, o) => s + o.totalPkr, 0);
  const outstanding = orders.filter((o) => o.payment === 'cod_unpaid').reduce((s, o) => s + o.totalPkr, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Payments</h2>
          <p>v1 is cash on delivery only. Track visit fees and pharmacy COD collections — no card gateway.</p>
        </div>
      </div>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card kpi">
          <div className="label">Visit fees (booked)</div>
          <div className="value">{money(visitFees)}</div>
        </div>
        <div className="card kpi">
          <div className="label">Pharmacy COD collected</div>
          <div className="value">{money(collected)}</div>
        </div>
        <div className="card kpi">
          <div className="label">Pharmacy COD outstanding</div>
          <div className="value">{money(outstanding)}</div>
        </div>
      </div>
      <div className="card table-wrap">
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
              <tr key={v.id}>
                <td>Home visit {v.code}</td>
                <td>{v.patientName}</td>
                <td>{money(v.feePkr)}</td>
                <td>
                  <span className={`chip ${v.status === 'completed' ? 'completed' : 'pending'}`}>
                    {v.status === 'completed' ? 'paid to nurse' : 'due on arrival'}
                  </span>
                </td>
              </tr>
            ))}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>Pharmacy {o.code}</td>
                <td>{o.patientName}</td>
                <td>{money(o.totalPkr)}</td>
                <td>
                  <span className={`chip ${chipClass(o.payment)}`}>{o.payment.replaceAll('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && orders.length === 0 ? <p className="muted">No payments yet.</p> : null}
      </div>
    </>
  );
}
