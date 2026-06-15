import { useRef, useState } from 'react';
import { Icons } from '../lib/icons.jsx';
import Popover from './Popover.jsx';

const PAGE_LABELS = {
  dashboard: 'FY 26',
  log:       'Journal',
  general:   'Overhead',
  payments:  'Settlements',
  clients:   'Accounts',
  vendors:   'Trades',
};

const TABS = [
  { id: 'dashboard', Icon: Icons.Dashboard,  label: 'Ledger' },
  { id: 'payments',  Icon: Icons.CreditCard, label: 'Pay'    },
  null,
  { id: 'general',   Icon: Icons.Receipt,    label: 'Overhead' },
  { id: 'clients',   Icon: Icons.Users,      label: 'Clients' },
  { id: 'vendors',   Icon: Icons.HardHat,    label: 'Trades' },
];

export default function MobileNav({ page, setPage, onSignOut, userEmail = '', companyName = '' }) {
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (companyName || userEmail || 'U').trim().charAt(0).toUpperCase();

  return (
    <>
      <div className="mobile-appbar">
        <span className="mobile-brand">Plinth</span>
        {PAGE_LABELS[page] && (
          <span className="mobile-folio">· {PAGE_LABELS[page]}</span>
        )}
        <div style={{ flex: 1 }} />
        {(page === 'vendors' || page === 'clients') && (
          <button className="mobile-icon-btn" aria-label="Search">
            <Icons.Search size={18} />
          </button>
        )}
        <button
          ref={menuRef}
          type="button"
          className="mobile-icon-btn"
          aria-label="Profile menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="mobile-avatar">{initial}</span>
        </button>
        <Popover
          triggerRef={menuRef}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          align="right"
        >
          <div className="sh-list">
            <button
              type="button"
              className="sh-item"
              style={{ color: 'var(--red-ink)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              onClick={() => { setMenuOpen(false); onSignOut?.(); }}
            >
              <Icons.LogOut size={14} />
              <span style={{ flex: 1 }}>Sign out</span>
            </button>
          </div>
        </Popover>
      </div>

      <div className="mobile-tabbar">
        {TABS.map((tab, i) =>
          tab === null ? (
            <div key="fab" className="mobile-fab-wrap">
              <button
                className={'mobile-fab' + (page === 'log' ? ' active' : '')}
                onClick={() => setPage('log')}
                aria-label="Log expense"
              >
                <Icons.Plus size={24} />
              </button>
            </div>
          ) : (
            <button
              key={tab.id}
              type="button"
              className={'mobile-tab' + (page === tab.id ? ' active' : '')}
              onClick={() => setPage(tab.id)}
            >
              <tab.Icon size={20} />
              <span>{tab.label}</span>
            </button>
          )
        )}
      </div>
    </>
  );
}
