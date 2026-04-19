import { useRef, useState } from 'react';
import { Icons } from '../lib/icons.jsx';
import { useData } from '../contexts/DataContext.jsx';
import Popover from './Popover.jsx';

export default function Sidebar({ page, setPage, userEmail = '', onSignOut, companyName = '' }) {
  const d = useData();
  const profileRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const items = [
    { id: 'dashboard', label: 'Ledger', icon: Icons.Dashboard, count: null },
    { id: 'log', label: 'Log Expense', icon: Icons.FilePlus, count: d.expenses.length },
    { id: 'general', label: 'General Expenses', icon: Icons.Receipt, count: d.generalExpenses.length },
    { id: 'payments', label: 'Vendor Payments', icon: Icons.CreditCard, count: d.vendorPayments.length },
    { id: 'clients', label: 'Clients', icon: Icons.Users, count: d.clients.length },
    { id: 'vendors', label: 'Vendors', icon: Icons.HardHat, count: d.vendors.length },
  ];
  const initial = (companyName || userEmail || 'U').trim().charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">
          Plinth
        </div>
        <div className="sub">FY 26</div>
      </div>
      <div className="nav-label">Books</div>
      {items.map((it) => {
        const Ic = it.icon;
        return (
          <button
            key={it.id}
            type="button"
            className={'nav-item' + (page === it.id ? ' active' : '')}
            onClick={() => setPage(it.id)}
          >
            <Ic />
            <span>{it.label}</span>
            {it.count != null && <span className="nav-count">{it.count}</span>}
          </button>
        );
      })}

      <button
        ref={profileRef}
        type="button"
        className="profile-btn"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Profile menu"
      >
        <div className="profile-avatar">{initial}</div>
        <div className="profile-info">
          <div className="profile-email">{companyName || userEmail}</div>
          <div className="profile-role">{userEmail}</div>
        </div>
        <Icons.ChevronDown size={12} />
      </button>
      <Popover
        triggerRef={profileRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        align="left"
        matchTriggerWidth
      >
        <div className="sh-list">
          <button
            type="button"
            className="sh-item"
            onClick={() => {
              setMenuOpen(false);
              onSignOut?.();
            }}
            style={{ color: 'var(--red-ink)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <Icons.LogOut size={14} />
            <span style={{ flex: 1 }}>Log out</span>
          </button>
        </div>
      </Popover>
    </aside>
  );
}
