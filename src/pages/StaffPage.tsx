import { Avatar, EmptyState } from '@/components/ui';
import { useStore } from '@/lib/store';

export function StaffPage() {
  const { nurses, visits, toggleNurseAccepting } = useStore();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">People</div>
          <h2>Staff roster</h2>
          <p>Nurses and caregivers from the CareVisit app. Toggle accepting jobs if someone is off shift.</p>
        </div>
      </div>
      {nurses.length === 0 ? (
        <div className="card">
          <EmptyState title="No nurses yet" body="When a nurse finishes onboarding in the app, they show up here." />
        </div>
      ) : (
        <div className="grid-3">
          {nurses.map((n) => {
            const load = visits.filter((v) => v.nurseId === n.id && !['completed', 'cancelled'].includes(v.status)).length;
            return (
              <div className="card stack staff-card" key={n.id}>
                <div className="staff-top">
                  <Avatar name={n.name} size={52} tone={n.accepting ? 'care' : 'warm'} />
                  <div>
                    <h3>{n.name}</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      {n.specialty}
                    </p>
                  </div>
                </div>
                <div className="muted">
                  License {n.license}
                  <br />
                  {n.phone}
                  <br />
                  {n.email}
                </div>
                <div className="row">
                  <span className="chip pending">{load} active</span>
                  <span className={`chip ${n.accepting ? 'approved' : 'cancelled'}`}>
                    {n.accepting ? 'Accepting' : 'Off duty'}
                  </span>
                </div>
                <button className="btn btn-ghost" onClick={() => void toggleNurseAccepting(n.id)}>
                  {n.accepting ? 'Mark off duty' : 'Mark accepting jobs'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
