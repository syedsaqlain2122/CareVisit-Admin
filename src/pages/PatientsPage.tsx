import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState, PersonCell } from '@/components/ui';
import { paths } from '@/lib/paths';
import { money, useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function PatientsPage() {
  const navigate = useNavigate();
  const { patients, visits, orders, insuranceReviews } = useStore();
  const [params] = useSearchParams();
  const focusId = params.get('id');
  const selected = useMemo(
    () => (focusId ? patients.find((p) => p.id === focusId) : null) ?? patients[0] ?? null,
    [focusId, patients],
  );

  useEffect(() => {
    if (!selected) return;
    document.getElementById(`patient-${selected.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [selected?.id]);

  const patientVisits = selected ? visits.filter((v) => v.patientId === selected.id) : [];
  const patientOrders = selected ? orders.filter((o) => o.patientId === selected.id) : [];
  const waitingInsurance = selected ? insuranceReviews.find((i) => i.profileId === selected.id) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">People</div>
          <h2>Patients</h2>
          <p>People booking home visits from the CareVisit app. Open a row for visits, orders, and verification.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card card-flush">
          {patients.length === 0 ? (
            <EmptyState title="No patients yet" body="Sign-ups from the patient app appear in this directory." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>City</th>
                    <th>Verification</th>
                    <th>Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr
                      key={p.id}
                      id={`patient-${p.id}`}
                      className={`clickable${selected?.id === p.id ? ' is-selected' : ''}`}
                      onClick={() => navigate(paths.patient(p.id))}
                    >
                      <td>
                        <PersonCell name={p.name} />
                      </td>
                      <td>
                        {p.phone}
                        <div className="muted">{p.email}</div>
                      </td>
                      <td>{p.city}</td>
                      <td>
                        <span className={`chip ${chipClass(p.verification)}`}>{p.verification.replaceAll('_', ' ')}</span>
                      </td>
                      <td className="mono">{visits.filter((v) => v.patientId === p.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card stack assign-panel">
          {selected ? (
            <>
              <div>
                <div className="panel-kicker">Patient</div>
                <h3 style={{ margin: '6px 0 0', fontSize: 22 }}>{selected.name}</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  {selected.phone}
                  <br />
                  {selected.email}
                </p>
              </div>
              <dl className="review-meta">
                <div>
                  <dt>City</dt>
                  <dd>{selected.city}</dd>
                </div>
                <div>
                  <dt>CNIC</dt>
                  <dd className="mono">{selected.cnic}</dd>
                </div>
                <div>
                  <dt>Verification</dt>
                  <dd>
                    <span className={`chip ${chipClass(selected.verification)}`}>
                      {selected.verification.replaceAll('_', ' ')}
                    </span>
                  </dd>
                </div>
              </dl>
              {selected.verification === 'under_review' ? (
                <Link className="btn btn-ghost btn-sm" to={paths.verification(selected.id)}>
                  Open ID review
                </Link>
              ) : null}
              {waitingInsurance ? (
                <Link className="btn btn-ghost btn-sm" to={paths.insurance(waitingInsurance.id)}>
                  Open insurance review
                </Link>
              ) : null}
              <div>
                <div className="panel-kicker">Visits</div>
                {patientVisits.length === 0 ? (
                  <p className="muted">No visits yet.</p>
                ) : (
                  <ul className="jump-list">
                    {patientVisits.map((v) => (
                      <li key={v.id}>
                        <Link to={paths.visit(v.id)}>
                          <span className="mono">{v.code}</span>
                          <span>{v.service}</span>
                          <span className={`chip ${chipClass(v.status)}`}>{v.status.replaceAll('_', ' ')}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="panel-kicker">Orders</div>
                {patientOrders.length === 0 ? (
                  <p className="muted">No pharmacy orders yet.</p>
                ) : (
                  <ul className="jump-list">
                    {patientOrders.map((o) => (
                      <li key={o.id}>
                        <Link to={paths.order(o.id)}>
                          <span className="mono">{o.code}</span>
                          <span>{money(o.totalPkr)}</span>
                          <span className={`chip ${chipClass(o.status)}`}>{o.status.replaceAll('_', ' ')}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="Select a patient" body="Choose someone on the left to see visits and orders." />
          )}
        </div>
      </div>
    </>
  );
}
