import { Link, useNavigate } from 'react-router-dom';
import { CardHead, EmptyState, KpiCard, PersonCell } from '@/components/ui';
import { paths } from '@/lib/paths';
import { money, nurseName, useStore } from '@/lib/store';
import { chipClass, isQueuedVisit } from '@/lib/types';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { visits, orders, nurses, currentAdmin, idReviews, insuranceReviews } = useStore();
  const pending = visits.filter((v) => isQueuedVisit(v.status)).length;
  const live = visits.filter((v) => ['assigned', 'on_the_way', 'arrived', 'in_progress'].includes(v.status)).length;
  const review = idReviews.length;
  const insurance = insuranceReviews.length;
  const assigned = visits.filter((v) => v.nurseId);
  const firstName = currentAdmin?.name.split(' ')[0] ?? 'there';

  return (
    <>
      <div className="hero">
        <div>
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Operations
          </div>
          <h2>
            {greeting()}, {firstName}
          </h2>
          <p>Home-care queue from the CareVisit app. Cash on delivery only — no cards.</p>
        </div>
        <div className="hero-aside">
          <div className="muted">Open requests</div>
          <strong>{pending}</strong>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 18 }}>
        <KpiCard label="Pending requests" value={pending} hint="Open + in review" tone="primary" to="/requests" />
        <KpiCard label="Live visits" value={live} hint="Assigned through in progress" tone="care" to="/requests" />
        <KpiCard
          label="IDs to review"
          value={review}
          hint={insurance > 0 ? `${insurance} insurance waiting` : 'Patients + nurses under review'}
          tone="warm"
          to="/verification"
        />
        <KpiCard
          label="COD outstanding"
          value={money(
            orders
              .filter((o) => o.payment === 'cod_unpaid' && o.status !== 'cancelled')
              .reduce((s, o) => s + o.totalPkr, 0),
          )}
          hint="Pharmacy not yet collected"
          tone="deep"
          to="/pharmacy"
        />
      </div>
      <div className="grid-2">
        <div className="card card-flush">
          <CardHead title="Request queue" action={<Link to="/requests">Open queue</Link>} />
          {visits.length === 0 ? (
            <EmptyState title="No visits yet" body="New bookings from the patient app land here." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.slice(0, 5).map((v) => (
                    <tr
                      key={v.id}
                      className="clickable"
                      onClick={() => navigate(paths.visit(v.id))}
                    >
                      <td className="mono">{v.code}</td>
                      <td>
                        <PersonCell name={v.patientName} meta={v.patientPhone} to={paths.patient(v.patientId)} />
                      </td>
                      <td>{v.service}</td>
                      <td>
                        <span className={`chip ${chipClass(v.status)}`}>{v.status.replaceAll('_', ' ')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card card-flush">
          <CardHead title="Nurses on shift" action={<Link to="/staff">Roster</Link>} />
          {nurses.length === 0 ? (
            <EmptyState title="No nurses yet" body="Staff who sign up in the nurse app appear on this roster." />
          ) : (
            <div style={{ padding: '4px 8px 12px' }}>
              {nurses.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className="shift-row"
                  onClick={() => navigate(paths.nurse(n.id))}
                >
                  <PersonCell name={n.name} meta={n.specialty} />
                  <span className={`chip ${n.suspended ? 'cancelled' : n.accepting ? 'approved' : 'cancelled'}`}>
                    {n.suspended ? 'Suspended' : n.accepting ? 'Accepting' : 'Off'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card card-flush" style={{ marginTop: 16 }}>
        <CardHead title="Assigned visits" />
        {assigned.length === 0 ? (
          <EmptyState title="Nothing assigned" body="Pick a request in the visit queue and send a nurse." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Visit</th>
                  <th>Nurse</th>
                  <th>Window</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map((v) => (
                  <tr
                    key={v.id}
                    className="clickable"
                    onClick={() => navigate(paths.visit(v.id))}
                  >
                    <td>
                      <PersonCell name={v.patientName} meta={v.service} to={paths.patient(v.patientId)} />
                    </td>
                    <td>
                      {v.nurseId ? (
                        <Link
                          to={paths.nurse(v.nurseId)}
                          className="record-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {nurseName(nurses, v.nurseId)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{v.windowStart ? `${v.windowStart}–${v.windowEnd}` : '—'}</td>
                    <td className="mono">{money(v.feePkr)}</td>
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
