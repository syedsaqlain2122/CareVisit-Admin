import { FormEvent, useState } from 'react';
import { useStore } from '@/lib/store';

export function AdminsPage() {
  const { admins, currentAdmin, addAdmin, removeAdmin } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = addAdmin({ name, email, password });
    if (err) {
      setOk(false);
      setMessage(err);
      return;
    }
    setOk(true);
    setMessage(`${email.trim().toLowerCase()} can now sign in as an admin.`);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Admin users</h2>
          <p>Operators who can sign into this portal. New accounts can log in immediately with the password you set.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card stack">
          <h3 style={{ margin: 0 }}>Add admin</h3>
          <form className="stack" onSubmit={onSubmit}>
            <div className="field">
              <label>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@carevisit.app" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            {message ? <div className={ok ? 'muted' : 'error'}>{message}</div> : null}
            <button className="btn btn-primary" type="submit">
              Create admin
            </button>
          </form>
        </div>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.name}
                    {a.email === currentAdmin?.email ? <span className="muted"> · you</span> : null}
                  </td>
                  <td>{a.email}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => removeAdmin(a.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
