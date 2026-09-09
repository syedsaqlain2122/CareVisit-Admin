import { useNavigate } from 'react-router-dom';
import { EmptyState, PersonCell } from '@/components/ui';
import { paths } from '@/lib/paths';
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
  const navigate = useNavigate();
  const { nurseReviews } = useStore();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Oversight</div>
          <h2>Reviews</h2>
          <p>
            Patient ratings of nurses after a completed visit. Lowest scores first so weak care is easy to spot. Open a
            row for the visit, or the nurse name for their roster card.
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
                  <tr key={r.id} className="clickable" onClick={() => navigate(paths.visit(r.visitId))}>
                    <td>
                      <PersonCell
                        name={r.nurseName}
                        meta={whenLabel(r.createdAt) || undefined}
                        to={r.nurseId ? paths.nurse(r.nurseId) : undefined}
                      />
                    </td>
                    <td>
                      <span className={`chip ${ratingChip(r.rating)}`} title={`${r.rating} of 5`}>
                        {stars(r.rating)} {r.rating}
                      </span>
                    </td>
                    <td>{r.comment?.trim() || <span className="muted">No comment</span>}</td>
                    <td>
                      <span className="mono">{r.visitCode}</span>
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
