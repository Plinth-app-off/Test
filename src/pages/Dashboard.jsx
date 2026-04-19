import { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { fmt, fmtDate, withinRange, tradeColor, catColor, heatClass } from '../lib/utils.js';
import { Rupee, Icons } from '../lib/icons.jsx';
import Modal from '../components/Modal.jsx';
import BudgetBar from '../components/BudgetBar.jsx';
import Sparkline from '../components/Sparkline.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import ReceiptThumb from '../components/ReceiptThumb.jsx';

function FilterBar({ filter, setFilter, showInactive, setShowInactive }) {
  return (
    <div className="filter-bar">
      <div className="hstack" style={{ gap: 10 }}>
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.14em',
            color: 'var(--ink-3)',
            textTransform: 'uppercase',
          }}
        >
          Period
        </span>
        <DateRangePicker
          range={filter}
          onChange={(r) =>
            setFilter(
              r.preset === 'all'
                ? { preset: 'all' }
                : { ...r, preset: r.preset || 'custom' }
            )
          }
        />
      </div>
      <label className="toggle">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
        />
        Show inactive clients
      </label>
    </div>
  );
}

function Matrix({ cellMode, filter, onOpenCell, onOpenClient }) {
  const d = useData();
  const activeClients = d.clients.filter((c) => c.active || filter.showInactive);
  const maxCell = useMemo(() => {
    let m = 0;
    d.vendors.forEach((v) =>
      activeClients.forEach((c) => {
        const a = d.getCellAmount(v.id, c.id, filter);
        if (a > m) m = a;
      })
    );
    return m || 1;
  }, [d.expenses, activeClients, filter]);
  const clientSpent = activeClients.map((c) => d.getClientExpenses(c.id, filter));

  return (
    <div className="grid-wrap">
      <table className="ledger">
        <thead>
          <tr>
            <th className="corner">
              <div className="col-label">Folio · 01</div>
              <div className="h-title">Vendors ↓ · Clients →</div>
            </th>
            {activeClients.map((c, i) => {
              const sp = clientSpent[i];
              return (
                <th
                  key={c.id}
                  className="client-head"
                  style={{ '--client-color': c.color }}
                  onClick={() => onOpenClient(c)}
                >
                  <div className="name">
                    <span className="dot" style={{ background: c.color }} />
                    {c.short}
                    {!c.active && (
                      <span
                        className="mono"
                        style={{ fontSize: 9, color: 'var(--ink-3)' }}
                      >
                        · INACTIVE
                      </span>
                    )}
                  </div>
                  <div className="meta">
                    <span>
                      <Rupee />
                      {fmt(sp.total)}
                    </span>
                    <span>of {fmt(c.budget / 1000)}k</span>
                  </div>
                  <BudgetBar spent={sp.total} budget={c.budget} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {d.vendors.map((v) => {
            const vPaid = d.getVendorPaid(v.id);
            return (
              <tr key={v.id}>
                <td
                  className="vendor-label"
                  style={{ '--trade-color': tradeColor(v.trade) }}
                >
                  <div className="vname">
                    {v.name}
                    <span className="trade">{v.trade}</span>
                  </div>
                  {vPaid > 0 && (
                    <div className="vpaid">
                      <Rupee />
                      {fmt(vPaid)} paid
                    </div>
                  )}
                </td>
                {activeClients.map((c) => {
                  const amt = d.getCellAmount(v.id, c.id, filter);
                  const series =
                    cellMode === 'sparkline' ? d.getCellSeries(v.id, c.id, 30) : null;
                  const heat = cellMode === 'heatmap' ? heatClass(amt, maxCell) : '';
                  return (
                    <td
                      key={c.id}
                      className={'cell ' + heat + (amt === 0 ? ' empty' : '')}
                      style={{ '--client-color': c.color }}
                      onClick={() => amt > 0 && onOpenCell(v, c)}
                    >
                      {amt === 0 ? (
                        '—'
                      ) : (
                        <>
                          <span>
                            <Rupee />
                            {fmt(amt)}
                          </span>
                          {cellMode === 'sparkline' && amt > 0 && (
                            <Sparkline data={series} color={c.color} />
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr className="general-row">
            <td className="vendor-label">
              <div className="vname">General · Overhead</div>
              <div className="vpaid" style={{ color: 'var(--purple-ink)' }}>
                site-wide expenses
              </div>
            </td>
            {activeClients.map((c) => {
              const g = d.getGeneralByClient(c.id, filter);
              return (
                <td key={c.id} className={'cell' + (g === 0 ? ' empty' : '')}>
                  {g === 0 ? (
                    '—'
                  ) : (
                    <>
                      <Rupee />
                      {fmt(g)}
                    </>
                  )}
                </td>
              );
            })}
          </tr>
          <tr className="total-row">
            <td className="vendor-label">Client Totals</td>
            {activeClients.map((c, i) => {
              const sp = clientSpent[i];
              const over = sp.total > c.budget;
              return (
                <td key={c.id} className={'cell' + (over ? ' over' : '')}>
                  <Rupee />
                  {fmt(sp.total)}
                  <span className="sub">
                    {over
                      ? `over by ₹${fmt(sp.total - c.budget)}`
                      : `${Math.round((sp.total / c.budget) * 100)}% of budget`}
                  </span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <div className="ornament">· · ·</div>
      <div
        className="hstack"
        style={{
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--ink-3)',
          fontFamily: 'var(--mono)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>Click any cell to open the journal entry</span>
        <span>Ledger FY 2026 · entered in good faith</span>
      </div>
    </div>
  );
}

function CellModal({ open, onClose, vendor, client, filter }) {
  const d = useData();
  if (!open || !vendor || !client) return null;
  const rows = d
    .getCellExpenses(vendor.id, client.id, filter)
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((a, b) => a + b.amount, 0);
  return (
    <Modal open={open} onClose={onClose} width={700}>
      <div className="modal-head">
        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.16em',
              color: 'var(--coral-ink)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Journal Entry · Folio 01
          </div>
          <h2 style={{ marginTop: 6 }}>
            {vendor.name}{' '}
            <span className="muted serif italic" style={{ fontWeight: 400 }}>
              at
            </span>{' '}
            {client.short}
          </h2>
          <div className="sub">
            {rows.length} transactions · Total <Rupee />
            {fmt(total)}
          </div>
        </div>
        <button className="btn-icon" onClick={onClose}>
          <Icons.X />
        </button>
      </div>
      <div className="modal-body">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Date</th>
              <th>Description</th>
              <th style={{ width: 60 }}>Receipt</th>
              <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="mono" style={{ fontSize: 11 }}>
                  {fmtDate(r.date)}
                </td>
                <td>{r.description}</td>
                <td>
                  <ReceiptThumb src={r.receipt_url} />
                </td>
                <td className="num">
                  <Rupee />
                  {fmt(r.amount)}
                </td>
              </tr>
            ))}
            <tr>
              <td
                colSpan={3}
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: 'var(--ink-3)',
                  textTransform: 'uppercase',
                  textAlign: 'right',
                }}
              >
                Sum
              </td>
              <td
                className="num"
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  borderTop: '2px double var(--ink-3)',
                  color: 'var(--accent)',
                }}
              >
                <Rupee />
                {fmt(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function ClientModal({ open, onClose, client }) {
  const d = useData();
  const [addAmount, setAddAmount] = useState('');
  if (!open || !client) return null;
  const { vendor, general } = d.getClientAllExpenses(client.id);
  const vendorTotal = vendor.reduce((a, b) => a + b.amount, 0);
  const genTotal = general.reduce((a, b) => a + b.amount, 0);
  const total = vendorTotal + genTotal;
  const remaining = client.budget - total;
  const submitAdd = () => {
    const n = parseFloat(addAmount);
    if (!n) return;
    d.updateClient(client.id, { budget: client.budget + n });
    setAddAmount('');
  };
  return (
    <Modal open={open} onClose={onClose} width={820}>
      <div className="modal-head" style={{ borderTop: `3px solid ${client.color}` }}>
        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.16em',
              color: client.color,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Client Account
          </div>
          <h2 style={{ marginTop: 6 }}>{client.name}</h2>
          <div className="sub">
            Opened {fmtDate(client.started)} · {client.active ? 'Active' : 'Inactive'}
          </div>
        </div>
        <button className="btn-icon" onClick={onClose}>
          <Icons.X />
        </button>
        {remaining < 0 && <div className="stamp">Over Budget</div>}
      </div>
      <div className="modal-body">
        <div className="stats-row">
          <div className="stat">
            <div className="k">Total Spent</div>
            <div className="v">
              <Rupee />
              {fmt(total)}
            </div>
          </div>
          <div className="stat">
            <div className="k">Budget</div>
            <div className="v">
              <Rupee />
              {fmt(client.budget)}
            </div>
            <div className="inline-form">
              <input
                className="input"
                placeholder="+ amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
              <button className="btn btn-sm btn-primary" onClick={submitAdd}>
                Add
              </button>
            </div>
          </div>
          <div className="stat">
            <div className="k">Remaining</div>
            <div
              className="v"
              style={{ color: remaining < 0 ? 'var(--red-ink)' : 'var(--green-ink)' }}
            >
              {remaining < 0 ? '−' : ''}
              <Rupee />
              {fmt(Math.abs(remaining))}
            </div>
            <div className="sub">
              {Math.round((total / client.budget) * 100)}% used
            </div>
          </div>
          <div className="stat">
            <div className="k">Notes</div>
            <div
              className="serif italic"
              style={{
                fontSize: 12.5,
                lineHeight: 1.4,
                marginTop: 2,
                color: 'var(--ink-2)',
              }}
            >
              {client.notes || '—'}
            </div>
          </div>
        </div>
        <div className="modal-section">
          <h4>
            Vendor Expenses · {vendor.length} entries · <Rupee /> {fmt(vendorTotal)}
          </h4>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 85 }}>Date</th>
                <th>Vendor</th>
                <th>Description</th>
                <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {vendor
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 8)
                .map((e) => {
                  const v = d.vendors.find((x) => x.id === e.vendor_id);
                  return (
                    <tr key={e.id}>
                      <td className="mono" style={{ fontSize: 11 }}>
                        {fmtDate(e.date)}
                      </td>
                      <td>{v?.name}</td>
                      <td>{e.description}</td>
                      <td className="num">
                        <Rupee />
                        {fmt(e.amount)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="modal-section">
          <h4>
            General · Overhead · {general.length} entries · <Rupee /> {fmt(genTotal)}
          </h4>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 85 }}>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {general
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => (
                  <tr key={e.id}>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {fmtDate(e.date)}
                    </td>
                    <td>
                      <span
                        className="cat-badge"
                        style={{ '--cat-color': catColor(e.category) }}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td>{e.description}</td>
                    <td className="num">
                      <Rupee />
                      {fmt(e.amount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

export default function Dashboard({ onLogExpense }) {
  const cellMode = 'heatmap';
  const d = useData();
  const [filter, setFilter] = useState({ preset: 'all' });
  const [showInactive, setShowInactive] = useState(false);
  const [cellModal, setCellModal] = useState({ open: false, vendor: null, client: null });
  const [clientModal, setClientModal] = useState({ open: false, client: null });
  const effFilter = { ...filter, showInactive };
  const totalSpend =
    d.expenses.reduce(
      (a, b) => a + (withinRange(b.date, filter) ? b.amount : 0),
      0
    ) +
    d.generalExpenses.reduce(
      (a, b) => a + (withinRange(b.date, filter) ? b.amount : 0),
      0
    );
  const totalBudget = d.clients
    .filter((c) => c.active)
    .reduce((a, b) => a + b.budget, 0);
  const totalReceived = d.vendorPayments.reduce((a, b) => a + b.amount, 0);
  const overCount = d.clients.filter(
    (c) => c.active && d.getClientExpenses(c.id, null).total > c.budget
  ).length;
  return (
    <>
      <div className="page-head">
        <div>
          <div className="folio">
            Folio 01 ·{' '}
            {new Date().toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <h1>
            The <em>Ledger</em>
          </h1>
          <p className="lede">A vendor × client account of the month's undertakings.</p>
        </div>
        <div className="page-head-right">
          <div className="hstack" style={{ gap: 14 }}>
            <div>Signed · S. Architect</div>
            <button className="btn" onClick={onLogExpense}>
              <Icons.FilePlus /> Log expense
            </button>
          </div>
        </div>
      </div>
      <div className="stat-strip">
        <div className="stat">
          <div className="k">Total Spend</div>
          <div className="v">
            <Rupee />
            {fmt(totalSpend)}
          </div>
          <div className="sub">
            {d.expenses.length + d.generalExpenses.length} entries
          </div>
        </div>
        <div className="stat">
          <div className="k">Total Budget</div>
          <div className="v">
            <Rupee />
            {fmt(totalBudget)}
          </div>
          <div className="sub">
            {d.clients.filter((c) => c.active).length} active clients
          </div>
        </div>
        <div className="stat">
          <div className="k">Paid to Vendors</div>
          <div className="v">
            <Rupee />
            {fmt(totalReceived)}
          </div>
          <div className="sub">{d.vendorPayments.length} payments recorded</div>
        </div>
        <div className="stat">
          <div className="k">Over-Budget Clients</div>
          <div
            className="v"
            style={{ color: overCount > 0 ? 'var(--red-ink)' : 'var(--green-ink)' }}
          >
            {overCount}
          </div>
          <div className={'sub ' + (overCount > 0 ? 'bad' : 'good')}>
            {overCount > 0 ? 'attention needed' : 'all within budget'}
          </div>
        </div>
      </div>
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
      />
      <Matrix
        cellMode={cellMode}
        filter={effFilter}
        onOpenCell={(v, c) =>
          setCellModal({ open: true, vendor: v, client: c })
        }
        onOpenClient={(c) => setClientModal({ open: true, client: c })}
      />
      <CellModal
        open={cellModal.open}
        onClose={() => setCellModal({ open: false })}
        vendor={cellModal.vendor}
        client={cellModal.client}
        filter={effFilter}
      />
      <ClientModal
        open={clientModal.open}
        onClose={() => setClientModal({ open: false })}
        client={clientModal.client}
      />
    </>
  );
}
