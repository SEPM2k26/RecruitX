import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/recruiter/login', { email, password });
      localStorage.setItem('recruitx_recruiter_token', data.token);
      localStorage.setItem('recruitx_recruiter_user', JSON.stringify(data.user));
      onLogin(data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-hand w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold mb-1">✎ RecruitX</h1>
        <p className="mb-6 text-pencil-light">Recruiter Portal — sign in to manage your drives</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input-hand"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recruiter@company.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block font-bold mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="input-hand"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="border-3 border-marker-red bg-postit-dark rounded-wobbly-sm px-3 py-2 text-marker-red font-bold" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-hand bg-postit w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t-2 border-dashed border-pencil/20 text-xs text-pencil-light text-center space-y-1">
          <p className="font-bold text-pencil">Demo Credentials (click to fill):</p>
          <div className="flex flex-col gap-1 items-center">
            <button
              type="button"
              className="underline hover:text-ink font-mono text-xs cursor-pointer"
              onClick={() => { setEmail('recruiter@recruitx.com'); setPassword('Recruiter@123'); }}
            >
              recruiter@recruitx.com • Recruiter@123 (TechCorp)
            </button>
            <button
              type="button"
              className="underline hover:text-ink font-mono text-xs cursor-pointer"
              onClick={() => { setEmail('rishi@teradata.com'); setPassword('Teradata123'); }}
            >
              rishi@teradata.com • Teradata123 (Teradata)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
