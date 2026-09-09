import { useEffect, useState } from 'react';
import { EmptyState, PersonCell } from '@/components/ui';
import { money, useStore } from '@/lib/store';
import { chipClass, type PharmacyOrder } from '@/lib/types';

export function PharmacyPage() {
  const { orders, setOrderStatus, cancelOrder } = useStore();
  const [selected, setSelected] = useState<PharmacyOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setSelected((prev) => (prev ? orders.find((o) => o.id === prev.id) : null) ?? orders[0] ?? null);
  }, [orders]);

  useEffect(() => {
    setCancelReason('');
    setMessage(null);
  }, [selected?.id]);

  const onCancel = async () => {
    if (!selected || cancelling) return;
    setCancelling(true);
    const err = await cancelOrder(selected.id, cancelReason);
    setCancelling(false);
    setMessage(err);
    if (!err) setCancelReason('');
  };

  const cancelled = selected?.status === 'cancelled';
  const delivered = selected?.status === 'delivered';
  const canCancel = !!selected && !cancelled && !delivered;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pharmacy</div>
          <h2>Orders</h2>
          <p>Medicine delivery from the patient app. Cash on delivery to courier on arrival.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card card-flush table-wrap">
          {orders.length === 0 ? (
            <EmptyState title="No pharmacy orders" body="When a patient checks out in the app, the order shows up here." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Patient</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className={selected?.id === o.id ? 'is-selected' : undefined}
                    onClick={() => setSelected(o)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="mono">{o.code}</td>
                    <td>
                      <PersonCell name={o.patientName} />
                    </td>
                    <td className="mono">{money(o.totalPkr)}</td>
                    <td>
                      <span className={`chip ${chipClass(o.status)}`}>{o.status.replaceAll('_', ' ')}</span>
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
                <div className="panel-kicker">Order detail</div>
                <h3 style={{ margin: '6px 0 0', fontSize: 22 }}>{selected.code}</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  {selected.patientName}
                  <br />
                  {selected.items}
                </p>
                <p>
                  <strong>{money(selected.totalPkr)}</strong>
                  <span className="muted"> · {selected.payment.replaceAll('_', ' ')}</span>
                </p>
              </div>
              {cancelled ? (
                <div className="error">
                  Cancelled{selected.cancelledBy ? ` by ${selected.cancelledBy}` : ''}.
                  {selected.cancellationReason ? ` Reason: ${selected.cancellationReason}` : ''}
                </div>
              ) : delivered ? (
                <p className="muted">Delivered — COD marked collected. This order can no longer be cancelled.</p>
              ) : (
                <>
                  <div className="row">
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => void setOrderStatus(selected.id, 'out_for_delivery')}
                    >
                      Dispatch
                    </button>
                    <button
                      className="btn btn-care btn-sm"
                      type="button"
                      onClick={() => void setOrderStatus(selected.id, 'delivered')}
                    >
                      Delivered + COD
                    </button>
                  </div>
                  <div className="field">
                    <label htmlFor="order-cancel-reason">Cancel on customer’s behalf</label>
                    <textarea
                      id="order-cancel-reason"
                      rows={2}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Reason shown to the patient (no-show, dispute…)"
                    />
                  </div>
                  <button
                    className="btn btn-danger"
                    type="button"
                    disabled={!canCancel || cancelling || !cancelReason.trim()}
                    onClick={() => void onCancel()}
                  >
                    Cancel order
                  </button>
                </>
              )}
              {message ? <div className="error">{message}</div> : null}
            </>
          ) : (
            <EmptyState title="Select an order" body="Choose an order on the left to dispatch, collect COD, or cancel." />
          )}
        </div>
      </div>
    </>
  );
}
