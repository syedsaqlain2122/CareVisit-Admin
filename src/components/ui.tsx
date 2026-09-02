import type { ReactNode } from 'react';

type AvatarTone = 'primary' | 'care' | 'deep' | 'warm';

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="10" fill="#131B4D" />
      <circle cx="13" cy="16" r="6" fill="#2451F0" />
      <circle cx="19" cy="16" r="6" fill="#17B897" fillOpacity="0.92" />
      <path d="M16 13v6M13 16h6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({
  name,
  size = 36,
  tone = 'primary',
}: {
  name: string;
  size?: number;
  tone?: AvatarTone;
}) {
  return (
    <span
      className={`avatar avatar-${tone}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
    >
      {initials(name)}
    </span>
  );
}

export function PersonCell({ name, meta }: { name: string; meta?: string }) {
  return (
    <div className="person">
      <Avatar name={name} />
      <div className="person-copy">
        <div className="person-name">{name}</div>
        {meta ? <div className="muted">{meta}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden>
        <span className="empty-orb empty-orb-a" />
        <span className="empty-orb empty-orb-b" />
        <span className="empty-plus">+</span>
      </div>
      <h3>{title}</h3>
      <p className="muted">{body}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children ? <div className="page-head-actions">{children}</div> : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: AvatarTone;
}) {
  return (
    <div className={`card kpi kpi-${tone}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint ? <div className="kpi-hint">{hint}</div> : null}
    </div>
  );
}

export function CardHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="card-head">
      <h3>{title}</h3>
      {action}
    </div>
  );
}
