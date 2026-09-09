import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState, PersonCell } from '@/components/ui';
import { money, useStore } from '@/lib/store';
import {
  chipClass,
  MEDICINE_CATEGORIES,
  type CatalogMedicine,
  type HowToUseStep,
  type MedicineCategory,
  type PharmacyOrder,
} from '@/lib/types';

type Tab = 'orders' | 'catalog';

const EMPTY_HOW_TO: HowToUseStep[] = [{ title: '', body: '' }];

const EMPTY_FORM = {
  name: '',
  subtitle: '',
  price: '',
  category: 'pain' as MedicineCategory,
  description: '',
  howToUse: EMPTY_HOW_TO,
  safetyTags: '',
  rxRequired: false,
  stock: '',
};

export function PharmacyPage() {
  const [params] = useSearchParams();
  const focusOrder = params.get('order');
  const [tab, setTab] = useState<Tab>('orders');

  useEffect(() => {
    if (focusOrder) setTab('orders');
  }, [focusOrder]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pharmacy</div>
          <h2>{tab === 'orders' ? 'Orders' : 'Catalog'}</h2>
          <p>
            {tab === 'orders'
              ? 'Medicine delivery from the patient app. Cash on delivery to courier on arrival.'
              : 'Edit the catalog patients see in the app. Hide a product to soft-delete it — past orders keep the name.'}
          </p>
        </div>
      </div>
      <div className="pills" style={{ marginBottom: 16 }}>
        <button type="button" className={`pill${tab === 'orders' ? ' on' : ''}`} onClick={() => setTab('orders')}>
          Orders
        </button>
        <button type="button" className={`pill${tab === 'catalog' ? ' on' : ''}`} onClick={() => setTab('catalog')}>
          Catalog
        </button>
      </div>
      {tab === 'orders' ? <OrdersPanel /> : <CatalogPanel />}
    </>
  );
}

function OrdersPanel() {
  const { orders, setOrderStatus, cancelOrder } = useStore();
  const [params] = useSearchParams();
  const focusId = params.get('order');
  const [selected, setSelected] = useState<PharmacyOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setSelected((prev) => {
      const fromQuery = focusId ? orders.find((o) => o.id === focusId) : null;
      return fromQuery ?? (prev ? orders.find((o) => o.id === prev.id) : null) ?? orders[0] ?? null;
    });
  }, [orders, focusId]);

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
  const rxIsPdf = (selected?.prescriptionPath ?? '').toLowerCase().endsWith('.pdf');

  return (
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
              </p>
            </div>
            <dl className="review-meta">
              <div>
                <dt>Phone</dt>
                <dd>{selected.patientPhone}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>
                  {selected.paymentMethod}
                  <span className={`chip ${chipClass(selected.payment)}`} style={{ marginLeft: 8 }}>
                    {selected.payment.replaceAll('_', ' ')}
                  </span>
                </dd>
              </div>
              <div className="review-meta-wide">
                <dt>Delivery address</dt>
                <dd>
                  {selected.addressLabel ? `${selected.addressLabel} · ` : ''}
                  {selected.addressLine || 'No address on file'}
                  {selected.addressNotes ? (
                    <>
                      <br />
                      <span className="muted">{selected.addressNotes}</span>
                    </>
                  ) : null}
                </dd>
              </div>
            </dl>
            <div>
              <div className="panel-kicker">Line items</div>
              {selected.lineItems.length === 0 ? (
                <p className="muted">{selected.items}</p>
              ) : (
                <table className="lines-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Each</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lineItems.map((item, i) => (
                      <tr key={`${item.name}-${i}`}>
                        <td>{item.name}</td>
                        <td className="mono">{item.qty}</td>
                        <td className="mono">{money(item.unitPricePkr)}</td>
                        <td className="mono">{money(item.unitPricePkr * item.qty)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3}>Subtotal</td>
                      <td className="mono">{money(selected.subtotalPkr)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3}>Tax</td>
                      <td className="mono">{money(selected.taxPkr)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3}>
                        <strong>Total</strong>
                      </td>
                      <td className="mono">
                        <strong>{money(selected.totalPkr)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
            <figure className="review-doc">
              <figcaption>Prescription</figcaption>
              {selected.prescriptionUrl ? (
                rxIsPdf ? (
                  <a className="review-doc-frame review-doc-link" href={selected.prescriptionUrl} target="_blank" rel="noreferrer">
                    Open prescription PDF
                  </a>
                ) : (
                  <a href={selected.prescriptionUrl} target="_blank" rel="noreferrer">
                    <img src={selected.prescriptionUrl} alt="Uploaded prescription" />
                  </a>
                )
              ) : (
                <div className="review-doc-frame muted">
                  {selected.prescriptionPath ? 'Could not load prescription' : 'No prescription uploaded (OTC order)'}
                </div>
              )}
            </figure>
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
          <EmptyState title="Select an order" body="Choose an order on the left to see delivery details, dispatch, or cancel." />
        )}
      </div>
    </div>
  );
}

function CatalogPanel() {
  const { medicines, saveMedicine, setMedicineActive } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const loadMedicine = (m: CatalogMedicine) => {
    setSelectedId(m.id);
    setForm({
      name: m.name,
      subtitle: m.subtitle,
      price: String(m.pricePkr),
      category: m.category,
      description: m.description,
      howToUse: m.howToUse.length > 0 ? m.howToUse : EMPTY_HOW_TO,
      safetyTags: m.safetyTags.join(', '),
      rxRequired: m.rxRequired,
      stock: String(m.stockQty),
    });
    setImageFile(null);
    setPreview(m.imageUrl);
    setMessage(null);
    setOk(false);
  };

  const startNew = () => {
    setSelectedId(null);
    setForm({ ...EMPTY_FORM, howToUse: [{ title: '', body: '' }] });
    setImageFile(null);
    setPreview(null);
    setMessage(null);
    setOk(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const err = await saveMedicine({
      id: selectedId ?? undefined,
      name: form.name,
      subtitle: form.subtitle,
      pricePkr: Number(form.price),
      category: form.category,
      description: form.description,
      howToUse: form.howToUse,
      safetyTags: form.safetyTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      rxRequired: form.rxRequired,
      stockQty: Number(form.stock),
      imageFile,
    });
    setBusy(false);
    if (err) {
      setOk(false);
      setMessage(err);
      return;
    }
    const added = selectedId ? 'Catalog item updated.' : 'Medicine added to the catalog.';
    if (!selectedId) {
      setForm({ ...EMPTY_FORM, howToUse: [{ title: '', body: '' }] });
      setImageFile(null);
      setPreview(null);
    } else {
      setImageFile(null);
    }
    setOk(true);
    setMessage(added);
  };

  const selected = selectedId ? medicines.find((m) => m.id === selectedId) : null;

  const onToggleActive = async () => {
    if (!selectedId || !selected) return;
    setBusy(true);
    const err = await setMedicineActive(selectedId, !selected.active);
    setBusy(false);
    if (err) {
      setOk(false);
      setMessage(err);
      return;
    }
    setOk(true);
    setMessage(selected.active ? 'Hidden from the patient catalog.' : 'Restored to the patient catalog.');
  };

  return (
    <div className="grid-2">
      <div className="card card-flush table-wrap">
        {medicines.length === 0 ? (
          <EmptyState title="No medicines yet" body="Add the first catalog item on the right." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr
                  key={m.id}
                  className={`${selectedId === m.id ? 'is-selected' : ''}${m.active ? '' : ' is-hidden'}`}
                  onClick={() => loadMedicine(m)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="med-cell">
                      {m.imageUrl ? <img src={m.imageUrl} alt="" className="med-thumb" /> : <span className="med-thumb med-thumb-empty" />}
                      <PersonCell
                        name={m.name}
                        meta={
                          !m.active ? 'Hidden' : m.rxRequired ? 'Rx required' : m.subtitle || undefined
                        }
                      />
                    </div>
                  </td>
                  <td>{MEDICINE_CATEGORIES.find((c) => c.key === m.category)?.label ?? m.category}</td>
                  <td className="mono">{money(m.pricePkr)}</td>
                  <td>
                    <span className={`chip ${m.stockQty > 0 ? 'approved' : 'cancelled'}`}>
                      {m.stockQty > 0 ? `${m.stockQty} in stock` : 'Out of stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="card stack assign-panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="panel-kicker">{selectedId ? 'Edit medicine' : 'New medicine'}</div>
            <h3 style={{ margin: '6px 0 0', fontSize: 22 }}>{selectedId ? form.name || 'Edit' : 'Add to catalog'}</h3>
          </div>
          {selectedId ? (
            <button className="btn btn-ghost btn-sm" type="button" onClick={startNew}>
              New
            </button>
          ) : null}
        </div>
        <form className="stack" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label htmlFor="med-name">Name</label>
            <input id="med-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label htmlFor="med-subtitle">Subtitle</label>
            <input
              id="med-subtitle"
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="e.g. 500mg · 24 tablets"
            />
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="med-price">Price (PKR)</label>
              <input
                id="med-price"
                type="number"
                min={0}
                step="1"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="med-category">Category</label>
              <select
                id="med-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as MedicineCategory }))}
              >
                {MEDICINE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="med-desc">Description</label>
            <textarea
              id="med-desc"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Shown on the product page in the app"
            />
          </div>
          <div className="field">
            <label>How to use</label>
            <p className="muted" style={{ margin: '0 0 8px' }}>
              Steps on the product page — typically Dosage, Administration, Limits.
            </p>
            <div className="stack">
              {form.howToUse.map((step, index) => (
                <div className="how-step" key={index}>
                  <input
                    aria-label={`How to use title ${index + 1}`}
                    placeholder="Title"
                    value={step.title}
                    onChange={(e) =>
                      setForm((f) => {
                        const howToUse = f.howToUse.map((s, i) => (i === index ? { ...s, title: e.target.value } : s));
                        return { ...f, howToUse };
                      })
                    }
                  />
                  <textarea
                    aria-label={`How to use body ${index + 1}`}
                    rows={2}
                    placeholder="Instructions"
                    value={step.body}
                    onChange={(e) =>
                      setForm((f) => {
                        const howToUse = f.howToUse.map((s, i) => (i === index ? { ...s, body: e.target.value } : s));
                        return { ...f, howToUse };
                      })
                    }
                  />
                  {form.howToUse.length > 1 ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, howToUse: f.howToUse.filter((_, i) => i !== index) }))
                      }
                    >
                      Remove step
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setForm((f) => ({ ...f, howToUse: [...f.howToUse, { title: '', body: '' }] }))}
              >
                Add step
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="med-safety">Safety tags</label>
            <input
              id="med-safety"
              value={form.safetyTags}
              onChange={(e) => setForm((f) => ({ ...f, safetyTags: e.target.value }))}
              placeholder="Pregnancy Safe, Kids 12+"
            />
            <p className="muted" style={{ margin: 0 }}>
              Comma-separated. Shown as chips under Safety check in the app.
            </p>
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.rxRequired}
              onChange={(e) => setForm((f) => ({ ...f, rxRequired: e.target.checked }))}
            />
            Prescription required
          </label>
          <div className="field">
            <label htmlFor="med-stock">Units in stock</label>
            <input
              id="med-stock"
              type="number"
              min={0}
              step="1"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              required
            />
            <p className="muted" style={{ margin: 0 }}>
              When this hits 0, the app shows Out of stock. Patients never see the number.
            </p>
          </div>
          <div className="field">
            <label htmlFor="med-image">Product image</label>
            <input
              id="med-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {preview ? <img src={preview} alt="" className="med-preview" /> : null}
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : selectedId ? 'Save changes' : 'Add medicine'}
          </button>
          {selected && selectedId ? (
            <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => void onToggleActive()}>
              {selected.active ? 'Hide from catalog' : 'Restore to catalog'}
            </button>
          ) : null}
          {message ? <div className={ok ? 'ok' : 'error'}>{message}</div> : null}
        </form>
      </div>
    </div>
  );
}
