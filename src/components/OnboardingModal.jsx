import { useState } from 'react';
import { useProfile } from '../contexts/ProfileContext.jsx';

export default function OnboardingPage() {
  const { saveCompanyName } = useProfile();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setBusy(true);
    try {
      await saveCompanyName(name.trim());
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
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
            <h3>One last step</h3>
          </div>
          <form onSubmit={submit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-2)', fontSize: 14 }}>
              What's the name of your firm or practice?
            </p>
            <div className="form-group">
              <label className="label" htmlFor="company-name">Company / Firm name</label>
              <input
                id="company-name"
                className="input"
                placeholder="e.g. Studio Arch · Buildcraft Associates"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && (
              <div className="warning danger" style={{ marginTop: 0 }}>{error}</div>
            )}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={busy || !name.trim()}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {busy ? 'Saving…' : 'Get started'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
