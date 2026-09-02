import { EmptyState, PersonCell } from '@/components/ui';
import { money, useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function PharmacyPage() {
  const { orders, setOrderStatus } = useStore();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pharmacy</div>
          <h2>Orders</h2>
          <p>Medicine delivery from the patient app. Cash on delivery to courier on arrival.</p>
        </div>
      </div>
      <div className="card card-flush">
        {orders.length === 0 ? (
          <EmptyState title="No pharmacy orders" body="When a patient checks out in the app, the order shows up here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Patient</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Fulfillment</th>
                  <th>Payment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.code}</td>
                    <td>
                      <PersonCell name={o.patientName} />
                    </td>
                    <td>{o.items}</td>
                    <td className="mono">{money(o.totalPkr)}</td>
                    <td>
                      <span className={`chip ${chipClass(o.status)}`}>{o.status.replaceAll('_', ' ')}</span>
                    </td>
                    <td>
                      <span className={`chip ${o.payment}`}>{o.payment.replaceAll('_', ' ')}</span>
                    </td>
                    <td>
                      <div className="row">
                        <button className="btn btn-ghost btn-sm" onClick={() => void setOrderStatus(o.id, 'out_for_delivery')}>
                          Dispatch
                        </button>
                        <button className="btn btn-care btn-sm" onClick={() => void setOrderStatus(o.id, 'delivered')}>
                          Delivered + COD
                        </button>
                      </div>
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
