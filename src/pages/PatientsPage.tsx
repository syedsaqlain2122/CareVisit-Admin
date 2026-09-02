import { EmptyState, PersonCell } from '@/components/ui';
import { useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function PatientsPage() {
  const { patients, visits } = useStore();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">People</div>
          <h2>Patients</h2>
          <p>People booking home visits from the CareVisit app.</p>
        </div>
      </div>
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
                  <tr key={p.id}>
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
    </>
  );
}
