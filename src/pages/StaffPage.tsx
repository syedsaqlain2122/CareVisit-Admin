import { useStore } from '@/lib/store';

export function StaffPage() {
  const { nurses, visits, toggleNurseAccepting } = useStore();

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Staff roster</h2>
          <p>Nurses and caregivers available for assignment. Toggle accepting jobs if someone is off shift.</p>
        </div>
      </div>
      <div className="grid-3">
        {nurses.map((n) => {
          const load = visits.filter((v) => v.nurseId === n.id && !['completed', 'cancelled'].includes(v.status)).length;
          return (
            <div className="card stack" key={n.id}>
              <div>
                <h3 style={{ margin: 0 }}>{n.name}</h3>
                <p className="muted">
                  {n.specialty} · License {n.license}
                </p>
              </div>
              <div className="muted">
                {n.phone}
                <br />
                {n.email}
              </div>
              <div className="row">
                <span className="chip approved">★ {n.rating.toFixed(1)}</span>
                <span className="chip pending">{load} active jobs</span>
                <span className={`chip ${n.accepting ? 'approved' : 'cancelled'}`}>
                  {n.accepting ? 'Accepting' : 'Off'}
                </span>
              </div>
              <button className="btn btn-ghost" onClick={() => toggleNurseAccepting(n.id)}>
                {n.accepting ? 'Mark off duty' : 'Mark accepting jobs'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
