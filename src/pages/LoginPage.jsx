import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      } else {
        const { error } = await signUp(email, password);
        if (error) setError(error.message);
        else setInfo('Check your email to confirm your account, then sign in.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper)',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            Plinth
          </div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: '0.18em',
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Construction Account Book
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-head" style={{ borderBottom: '1px solid var(--rule)' }}>
            <h3>{mode === 'signin' ? 'Sign in to your ledger' : 'Create an account'}</h3>
          </div>
          <form onSubmit={submit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="········"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="warning danger" style={{ marginTop: 0 }}>
                {error}
              </div>
            )}
            {info && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'color-mix(in oklab, var(--accent) 10%, var(--paper))',
                  border: '1px solid color-mix(in oklab, var(--accent) 30%, transparent)',
                  borderRadius: 'var(--radius)',
                  fontSize: 12,
                  color: 'var(--accent)',
                }}
              >
                {info}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={busy}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {busy
                ? 'Please wait…'
                : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
            </button>
          </form>
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--rule)',
              textAlign: 'center',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'var(--ink-3)',
            }}
          >
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <span
                  style={{ color: 'var(--accent)', cursor: 'pointer' }}
                  onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
                >
                  Create one
                </span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span
                  style={{ color: 'var(--accent)', cursor: 'pointer' }}
                  onClick={() => { setMode('signin'); setError(''); setInfo(''); }}
                >
                  Sign in
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
