import { useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function PatientsPage() {
  const { patients, visits } = useStore();

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Patients</h2>
          <p>People booking home visits from the CareVisit app.</p>
        </div>
      </div>
      <div className="card table-wrap">
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
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>
                  {p.phone}
                  <div className="muted">{p.email}</div>
                </td>
                <td>{p.city}</td>
                <td>
                  <span className={`chip ${chipClass(p.verification)}`}>{p.verification.replaceAll('_', ' ')}</span>
                </td>
                <td>{visits.filter((v) => v.patientId === p.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {patients.length === 0 ? <p className="muted">No patients have signed up yet.</p> : null}
      </div>
    </>
  );
}
