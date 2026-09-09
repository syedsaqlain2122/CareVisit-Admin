import { Link } from 'react-router-dom';
import { EmptyState, PersonCell } from '@/components/ui';
import { useStore } from '@/lib/store';
import { ratingChip } from '@/lib/types';

function stars(rating: number) {
  const n = Math.min(5, Math.max(1, Math.round(rating)));
  return `${'★'.repeat(n)}${'☆'.repeat(5 - n)}`;
}

function whenLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ReviewsPage() {
  const { nurseReviews } = useStore();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Oversight</div>
          <h2>Reviews</h2>
          <p>
            Patient ratings of nurses after a completed visit. Lowest scores first so weak care is easy to spot. Open a
            visit to see the booking.
          </p>
        </div>
      </div>
      <div className="card card-flush">
        {nurseReviews.length === 0 ? (
          <EmptyState title="No reviews yet" body="When a patient rates a completed visit, it appears here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nurse</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Visit</th>
                </tr>
              </thead>
              <tbody>
                {nurseReviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <PersonCell name={r.nurseName} meta={whenLabel(r.createdAt) || undefined} />
                    </td>
                    <td>
                      <span className={`chip ${ratingChip(r.rating)}`} title={`${r.rating} of 5`}>
                        {stars(r.rating)} {r.rating}
                      </span>
                    </td>
                    <td>{r.comment?.trim() || <span className="muted">No comment</span>}</td>
                    <td>
                      <Link to={`/requests?visit=${r.visitId}`} className="mono">
                        {r.visitCode}
                      </Link>
                      <div className="muted">{r.visitService}</div>
                    </td>
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
