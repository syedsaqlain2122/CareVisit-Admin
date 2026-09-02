import { EmptyState, PersonCell } from '@/components/ui';
import { useStore } from '@/lib/store';
import { chipClass } from '@/lib/types';

export function VerificationPage() {
  const { patients, setVerification } = useStore();
  const queue = patients.filter((p) => p.verification !== 'approved');

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Trust</div>
          <h2>ID review</h2>
          <p>Approve CNIC / ID uploads so patients can book visits. Nurses stay on license review in the roster.</p>
        </div>
      </div>
      <div className="card card-flush">
        {patients.length === 0 ? (
          <EmptyState title="No patients yet" body="ID uploads from the app will wait here for review." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>CNIC</th>
                    <th>City</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <PersonCell name={p.name} />
                      </td>
                      <td>{p.phone}</td>
                      <td className="mono">{p.cnic}</td>
                      <td>{p.city}</td>
                      <td>
                        <span className={`chip ${chipClass(p.verification)}`}>{p.verification.replaceAll('_', ' ')}</span>
                      </td>
                      <td>
                        <div className="row">
                          <button className="btn btn-care btn-sm" onClick={() => void setVerification(p.id, 'approved')}>
                            Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => void setVerification(p.id, 'rejected')}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {queue.length === 0 ? <p className="muted" style={{ padding: '0 20px 16px' }}>Everyone on this list is approved.</p> : null}
          </>
        )}
      </div>
    </>
  );
}
