import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogExpensePage from './pages/LogExpensePage.jsx';
import GeneralExpensePage from './pages/GeneralExpensePage.jsx';
import VendorPaymentsPage from './pages/VendorPaymentsPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import VendorsPage from './pages/VendorsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useProfile } from './contexts/ProfileContext.jsx';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [page, setPage] = useState(
    () => localStorage.getItem('sl_page') || 'dashboard'
  );

  useEffect(() => {
    localStorage.setItem('sl_page', page);
  }, [page]);

  if (authLoading || (user && profileLoading)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper)',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          color: 'var(--ink-3)',
          textTransform: 'uppercase',
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const companyName = profile?.company_name || '';
  const needsOnboarding = !profileLoading && !companyName;

  if (needsOnboarding) return <OnboardingModal />;

  const onSignOut = async () => {
    const ok = globalThis.confirm('Sign out of Plinth?');
    if (!ok) return;
    localStorage.removeItem('sl_page');
    await signOut();
  };

  let PageEl;
  if (page === 'dashboard')
    PageEl = <Dashboard onLogExpense={() => setPage('log')} />;
  else if (page === 'log') PageEl = <LogExpensePage />;
  else if (page === 'general') PageEl = <GeneralExpensePage />;
  else if (page === 'payments') PageEl = <VendorPaymentsPage />;
  else if (page === 'clients') PageEl = <ClientsPage />;
  else if (page === 'vendors') PageEl = <VendorsPage />;

  return (
    <div className="app" data-screen-label={'Plinth · ' + page}>
      <Sidebar
        page={page}
        setPage={setPage}
        onSignOut={onSignOut}
        userEmail={user.email}
        companyName={companyName}
      />
      <div className="main">{PageEl}</div>
    </div>
  );
}
