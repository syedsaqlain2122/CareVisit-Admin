import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState, PersonCell } from '@/components/ui';
import { useStore } from '@/lib/store';
import type { InsuranceReview } from '@/lib/types';

function DocPreview({ doc }: { doc: InsuranceReview['docs'][number] }) {
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
        <div className="review-doc-frame muted">{doc.path ? 'Could not load file' : 'No file uploaded'}</div>
      )}
    </figure>
  );
}

function blankDoc(docType: 'insurance_front' | 'insurance_back', label: string): InsuranceReview['docs'][number] {
  return { docType, label, path: '', signedUrl: null };
}

function ReviewCard({
  item,
  highlight,
  busy,
  reason,
  onReason,
  onApprove,
  onReject,
}: {
  item: InsuranceReview;
  highlight: boolean;
  busy: boolean;
  reason: string;
  onReason: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className={`card stack review-card${highlight ? ' is-selected' : ''}`} id={`ins-review-${item.id}`}>
      <div className="staff-top">
        <PersonCell name={item.name} meta="Patient" />
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
        <div>
          <dt>Provider</dt>
          <dd>{item.provider}</dd>
        </div>
        <div>
          <dt>Policy number</dt>
          <dd className="mono">{item.policyNumber}</dd>
        </div>
      </dl>
      <div className="review-docs">
        <DocPreview
          doc={item.docs.find((d) => d.docType === 'insurance_front') ?? blankDoc('insurance_front', 'Card front')}
        />
        <DocPreview
          doc={item.docs.find((d) => d.docType === 'insurance_back') ?? blankDoc('insurance_back', 'Card back')}
        />
      </div>
      <div className="field">
        <label htmlFor={`reject-ins-${item.id}`}>Rejection reason (optional)</label>
        <textarea
          id={`reject-ins-${item.id}`}
          rows={2}
          value={reason}
          onChange={(e) => onReason(e.target.value)}
          placeholder="Shown in the app if you reject this review"
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

export function InsurancePage() {
  const { insuranceReviews, setInsuranceStatus } = useStore();
  const [params] = useSearchParams();
  const focusId = params.get('policy');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) return;
    document.getElementById(`ins-review-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, insuranceReviews]);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setActionError(null);
    const error = await setInsuranceStatus(id, status, reasons[id]);
    setBusyId(null);
    if (error) setActionError(error);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Trust</div>
          <h2>Insurance review</h2>
          <p>
            Patients who submitted a policy for review. Check the provider, policy number, and card photos, then approve
            or reject. A rejection note is stored on the policy and shown in the app.
          </p>
        </div>
      </div>
      {actionError ? <div className="banner-error">{actionError}</div> : null}
      {insuranceReviews.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No insurance waiting"
            body="New submissions from the app with status under review appear here."
          />
        </div>
      ) : (
        <div className="stack">
          {insuranceReviews.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              highlight={item.id === focusId}
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
