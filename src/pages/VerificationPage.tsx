import { useMemo, useState } from 'react';
import { EmptyState, PersonCell } from '@/components/ui';
import { useStore } from '@/lib/store';
import type { IdReview } from '@/lib/types';

function DocPreview({ doc }: { doc: IdReview['docs'][number] }) {
  const isPdf = doc.path.toLowerCase().endsWith('.pdf');
  return (
    <figure className="review-doc">
      <figcaption>{doc.label}</figcaption>
      {doc.signedUrl ? (
        isPdf ? (
          <a className="review-doc-frame review-doc-link" href={doc.signedUrl} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        ) : (
          <a href={doc.signedUrl} target="_blank" rel="noreferrer">
            <img src={doc.signedUrl} alt={doc.label} />
          </a>
        )
      ) : (
        <div className="review-doc-frame muted">
          {doc.path ? 'Could not load file' : 'No file uploaded'}
        </div>
      )}
    </figure>
  );
}

function ReviewCard({
  item,
  busy,
  reason,
  onReason,
  onApprove,
  onReject,
}: {
  item: IdReview;
  busy: boolean;
  reason: string;
  onReason: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="card stack review-card">
      <div className="staff-top">
        <PersonCell name={item.name} meta={item.role === 'nurse' ? 'Nurse' : 'Patient'} />
      </div>
      <dl className="review-meta">
        <div>
          <dt>Phone</dt>
          <dd>{item.phone}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{item.email}</dd>
        </div>
        {item.role === 'patient' ? (
          <>
            <div>
              <dt>Date of birth</dt>
              <dd>{item.dob ?? '—'}</dd>
            </div>
            <div>
              <dt>CNIC</dt>
              <dd className="mono">{item.cnic ?? '—'}</dd>
            </div>
            <div className="review-meta-wide">
              <dt>Address</dt>
              <dd>{item.address ?? '—'}</dd>
            </div>
          </>
        ) : (
          <>
            <div>
              <dt>Specialty</dt>
              <dd>{item.specialty ?? '—'}</dd>
            </div>
            <div>
              <dt>License number</dt>
              <dd className="mono">{item.license ?? '—'}</dd>
            </div>
          </>
        )}
      </dl>
      <div className="review-docs">
        {item.role === 'patient' ? (
          <>
            <DocPreview
              doc={item.docs.find((d) => d.docType === 'id_front') ?? { docType: 'id_front', label: 'ID front', path: '', signedUrl: null }}
            />
            <DocPreview
              doc={item.docs.find((d) => d.docType === 'id_back') ?? { docType: 'id_back', label: 'ID back', path: '', signedUrl: null }}
            />
          </>
        ) : (
          <DocPreview
            doc={
              item.docs.find((d) => d.docType === 'nurse_license') ?? {
                docType: 'nurse_license',
                label: 'Nursing license',
                path: '',
                signedUrl: null,
              }
            }
          />
        )}
      </div>
      <div className="field">
        <label htmlFor={`reject-${item.id}`}>Rejection reason (optional)</label>
        <textarea
          id={`reject-${item.id}`}
          rows={2}
          value={reason}
          onChange={(e) => onReason(e.target.value)}
          placeholder="Shown if you reject this review"
        />
      </div>
      <div className="row">
        <button className="btn btn-care" disabled={busy} onClick={onApprove}>
          Approve
        </button>
        <button className="btn btn-danger" disabled={busy} onClick={onReject}>
          Reject
        </button>
      </div>
    </article>
  );
}

export function VerificationPage() {
  const { idReviews, setVerification } = useStore();
  const [tab, setTab] = useState<'patient' | 'nurse'>('patient');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const patients = useMemo(() => idReviews.filter((r) => r.role === 'patient'), [idReviews]);
  const nurses = useMemo(() => idReviews.filter((r) => r.role === 'nurse'), [idReviews]);
  const list = tab === 'patient' ? patients : nurses;

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setActionError(null);
    const error = await setVerification(id, status, reasons[id]);
    setBusyId(null);
    if (error) setActionError(error);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Trust</div>
          <h2>ID review</h2>
          <p>
            People with verification still under review. Open the documents, then approve or reject. A rejection note is
            stored on the profile.
          </p>
        </div>
      </div>
      <div className="pills" style={{ marginBottom: 16 }}>
        <button className={`pill ${tab === 'patient' ? 'on' : ''}`} onClick={() => setTab('patient')} type="button">
          Patients ({patients.length})
        </button>
        <button className={`pill ${tab === 'nurse' ? 'on' : ''}`} onClick={() => setTab('nurse')} type="button">
          Nurses ({nurses.length})
        </button>
      </div>
      {actionError ? <div className="banner-error">{actionError}</div> : null}
      {list.length === 0 ? (
        <div className="card">
          <EmptyState
            title={tab === 'patient' ? 'No patient IDs waiting' : 'No nurse licenses waiting'}
            body="New uploads from the app with status under review appear here."
          />
        </div>
      ) : (
        <div className="stack">
          {list.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              reason={reasons[item.id] ?? ''}
              onReason={(value) => setReasons((prev) => ({ ...prev, [item.id]: value }))}
              onApprove={() => void decide(item.id, 'approved')}
              onReject={() => void decide(item.id, 'rejected')}
            />
          ))}
        </div>
      )}
    </>
  );
}
