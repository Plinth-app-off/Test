import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProfileProvider } from './contexts/ProfileContext.jsx';
import { DataProvider } from './contexts/DataContext.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--paper)', padding: 24,
        }}>
          <div style={{ maxWidth: 480, width: '100%' }}>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
              Plinth
            </div>
            <div style={{
              background: '#fde8e4', border: '1px solid #f5c2b8', borderRadius: 4,
              padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12,
              color: '#c9341e', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {this.state.error.message}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
              If this says "supabaseUrl is required" — check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Vercel environment variables.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ProfileProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </ProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
