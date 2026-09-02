import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';

export function LoginPage() {
  const { currentAdmin, login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('saqlain@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (currentAdmin) return <Navigate to="/" replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const msg = login(email, password);
    if (msg) {
      setError(msg);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="login-wrap">
      <div className="card login-card stack">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect width="32" height="32" rx="8" fill="#131B4D" />
            <circle cx="13" cy="16" r="6" fill="#2451F0" />
            <circle cx="19" cy="16" r="6" fill="#17B897" fillOpacity="0.92" />
            <path d="M16 13v6M13 16h6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <div>
            <div className="display" style={{ fontSize: 12, letterSpacing: 1.4, color: '#2451F0' }}>
              CAREVIST ADMIN
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: 26 }}>Welcome back</h2>
          </div>
        </div>
        <p className="muted">
          Sign in to triage visit requests, assign nurses, review IDs, and manage operators.
        </p>
        <form className="stack" onSubmit={onSubmit}>
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
          <button className="btn btn-primary" type="submit">
            Sign in
          </button>
        </form>
        <p className="muted">
          Founder login: <strong>saqlain@gmail.com</strong> / <strong>123123</strong>
        </p>
      </div>
    </div>
  );
}
