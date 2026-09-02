import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BrandMark } from '@/components/ui';
import { useStore } from '@/lib/store';

export function LoginPage() {
  const { currentAdmin, authReady, login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!authReady) {
    return (
      <div className="login-wrap">
        <div className="empty">
          <div className="empty-art" aria-hidden>
            <span className="empty-orb empty-orb-a" />
            <span className="empty-orb empty-orb-b" />
            <span className="empty-plus">+</span>
          </div>
          <p className="muted">Connecting to CareVisit…</p>
        </div>
      </div>
    );
  }

  if (currentAdmin) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const msg = await login(email, password);
    setBusy(false);
    if (msg) {
      setError(msg);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div>
          <BrandMark size={48} />
          <h1>Calm ops for home care.</h1>
          <p>Triage visits, assign nurses, and collect cash on delivery — same live data as the CareVisit app.</p>
          <div className="login-pills">
            <span>Visit queue</span>
            <span>ID review</span>
            <span>COD only</span>
          </div>
        </div>
        <p className="muted" style={{ color: 'rgba(255,255,255,0.5)' }}>
          CareVisit Admin
        </p>
      </section>
      <section className="login-form-wrap">
        <div className="card login-card stack">
          <div>
            <div className="eyebrow">Sign in</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 28 }}>Welcome back</h2>
          </div>
          <p className="muted">Use your operator account. Live rows come from the patient and nurse apps.</p>
          <form className="stack" onSubmit={(e) => void onSubmit(e)}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setError(null);
                  setEmail(e.target.value);
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setError(null);
                  setPassword(e.target.value);
                }}
              />
            </div>
            {error ? <div className="error">{error}</div> : null}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
