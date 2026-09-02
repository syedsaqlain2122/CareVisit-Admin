import { useStore } from '@/lib/store';

export function VerificationPage() {
  const { patients, setVerification } = useStore();
  const queue = patients.filter((p) => p.verification !== 'approved');

  return (
    <>
      <div className="page-head">
        <div>
          <h2>ID review</h2>
          <p>Approve CNIC / ID uploads so patients can book visits. Nurses stay on license review in the roster.</p>
        </div>
      </div>
      <div className="card table-wrap">
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
                <td>{p.name}</td>
                <td>{p.phone}</td>
                <td>{p.cnic}</td>
                <td>{p.city}</td>
                <td>
                  <span className={`chip ${p.verification}`}>{p.verification.replaceAll('_', ' ')}</span>
                </td>
                <td>
                  <div className="row">
                    <button className="btn btn-care btn-sm" onClick={() => setVerification(p.id, 'approved')}>
                      Approve
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setVerification(p.id, 'rejected')}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {queue.length === 0 ? <p className="muted">No pending reviews.</p> : null}
      </div>
    </>
  );
}
