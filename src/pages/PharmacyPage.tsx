import { money, useStore } from '@/lib/store';

export function PharmacyPage() {
  const { orders, setOrderStatus } = useStore();

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Pharmacy orders</h2>
          <p>Medicine delivery from the patient app. Cash on delivery to courier on arrival.</p>
        </div>
      </div>
      <div className="card table-wrap">
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
                <td>{o.id}</td>
                <td>{o.patientName}</td>
                <td>{o.items}</td>
                <td>{money(o.totalPkr)}</td>
                <td>
                  <span className={`chip ${o.status}`}>{o.status.replaceAll('_', ' ')}</span>
                </td>
                <td>
                  <span className={`chip ${o.payment}`}>{o.payment.replaceAll('_', ' ')}</span>
                </td>
                <td>
                  <div className="row">
                    <button className="btn btn-ghost btn-sm" onClick={() => setOrderStatus(o.id, 'out_for_delivery')}>
                      Dispatch
                    </button>
                    <button
                      className="btn btn-care btn-sm"
                      onClick={() => setOrderStatus(o.id, 'delivered', 'cod_collected')}
                    >
                      Delivered + COD
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
