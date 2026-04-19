import { useState } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useProfile } from '../contexts/ProfileContext.jsx';
import { exportVendorPDF } from '../lib/exportPDF.js';
import { fmt, fmtDate, tradeColor, iso } from '../lib/utils.js';
import { Rupee, Icons } from '../lib/icons.jsx';
import Modal from '../components/Modal.jsx';
import Select from '../components/Select.jsx';
import DatePicker from '../components/DatePicker.jsx';

export default function VendorsPage() {
  const d = useData();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [history, setHistory] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pdfState, setPdfState] = useState(null);
  const isNew = editing && !editing.id;

  const save = () => {
    if (!editing.name) return;
    if (isNew) {
      d.addVendor({
        name: editing.name,
        trade: editing.trade || 'Misc',
        contact: editing.contact || '',
      });
    } else {
      d.updateVendor(editing.id, {
        name: editing.name,
        trade: editing.trade,
        contact: editing.contact,
      });
    }
    setEditing(null);
  };

  const openPdf = (vendor) =>
    setPdfState({ vendor, preset: '30', start: null, end: null });

  const runPdf = () => {
    if (!pdfState) return;
    const { vendor, preset, start, end } = pdfState;
    const endISO = iso(new Date());
    const vendorLabel = vendor ? vendor.name : 'All vendors';
    let periodLabel, dateFilter;

    if (preset === '7') {
      const s = new Date(); s.setDate(s.getDate() - 7);
      dateFilter = { start: iso(s), end: endISO };
      periodLabel = `Past 7 days · ${fmtDate(dateFilter.start)} — ${fmtDate(dateFilter.end)}`;
    } else if (preset === '30') {
      const s = new Date(); s.setDate(s.getDate() - 30);
      dateFilter = { start: iso(s), end: endISO };
      periodLabel = `Past 30 days · ${fmtDate(dateFilter.start)} — ${fmtDate(dateFilter.end)}`;
    } else if (preset === '90') {
      const s = new Date(); s.setDate(s.getDate() - 90);
      dateFilter = { start: iso(s), end: endISO };
      periodLabel = `Past 90 days · ${fmtDate(dateFilter.start)} — ${fmtDate(dateFilter.end)}`;
    } else if (preset === 'all') {
      dateFilter = null;
      periodLabel = `${vendorLabel} · All time`;
    } else {
      if (!start || !end) return;
      dateFilter = { start, end };
      periodLabel = `${fmtDate(start)} — ${fmtDate(end)}`;
    }

    const inRange = (date) =>
      !dateFilter || (date >= dateFilter.start && date <= dateFilter.end);

    const vendorList = vendor ? [vendor] : d.vendors;
    const allExpenses = d.expenses.filter(
      (e) => vendorList.some((v) => v.id === e.vendor_id) && inRange(e.date)
    ).sort((a, b) => b.date.localeCompare(a.date));
    const allPayments = d.vendorPayments.filter(
      (p) => vendorList.some((v) => v.id === p.vendor_id) && inRange(p.date)
    ).sort((a, b) => b.date.localeCompare(a.date));

    setPdfState(null);
    exportVendorPDF({
      vendor: vendor || null,
      expenses: allExpenses,
      payments: allPayments,
      clients: d.clients,
      periodLabel,
      companyName: profile?.company_name || '',
      userEmail: user?.email || '',
    });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="folio">Folio 06 · Trades</div>
          <h1>
            <em>Vendors</em>
          </h1>
          <p className="lede">Supplies given, amounts paid, and balance owed.</p>
        </div>
        <div className="page-head-right" style={{ gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() => setEditing({ name: '', trade: '', contact: '' })}
          >
            <Icons.Plus size={13} /> New vendor
          </button>
        </div>
      </div>
      <div style={{ padding: '22px 28px 40px' }}>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th style={{ width: 140 }}>Trade</th>
                <th style={{ width: 150 }}>Contact</th>
                <th style={{ width: 150, textAlign: 'right' }}>Supplied</th>
                <th style={{ width: 150, textAlign: 'right' }}>Paid</th>
                <th style={{ width: 200, textAlign: 'right' }}>Balance</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {d.vendors.map((v) => {
                const given = d.getVendorTotal(v.id, null);
                const paid = d.getVendorPaid(v.id);
                const net = given - paid;
                const tc = tradeColor(v.trade);
                return (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 4, height: 24, background: tc }} />
                        <span style={{ fontWeight: 500 }}>{v.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cat-badge" style={{ '--cat-color': tc }}>
                        {v.trade}
                      </span>
                    </td>
                    <td
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--ink-2)' }}
                    >
                      {v.contact}
                    </td>
                    <td className="num">
                      <Rupee />
                      {fmt(given)}
                    </td>
                    <td className="num">
                      {paid > 0 ? (
                        <>
                          <Rupee />
                          {fmt(paid)}
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="num">
                      {net > 0 ? (
                        <span className="num-amber">
                          <Rupee />
                          {fmt(net)}{' '}
                          <span
                            className="mono"
                            style={{
                              fontSize: 9,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                            }}
                          >
                            owed
                          </span>
                        </span>
                      ) : net < 0 ? (
                        <span className="num-pos">
                          <Rupee />
                          {fmt(-net)}{' '}
                          <span
                            className="mono"
                            style={{
                              fontSize: 9,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                            }}
                          >
                            overpaid
                          </span>
                        </span>
                      ) : (
                        <span className="muted">settled</span>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: 4,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          className="btn btn-sm"
                          onClick={() => openPdf(v)}
                          title="Download PDF for this vendor"
                        >
                          <Icons.Download size={11} /> PDF
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => setHistory(v)}
                        >
                          <Icons.Book size={12} /> History
                        </button>
                        <button
                          type="button"
                          className="delete-x"
                          onClick={() =>
                            setEditing({
                              id: v.id,
                              name: v.name,
                              trade: v.trade,
                              contact: v.contact,
                            })
                          }
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <Icons.Edit size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!history} onClose={() => setHistory(null)} width={780}>
        {history &&
          (() => {
            const rows = d
              .getVendorAllExpenses(history.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            const given = rows.reduce((a, b) => a + b.amount, 0);
            const paid = d.getVendorPaid(history.id);
            const net = given - paid;
            const payRows = d.vendorPayments
              .filter((p) => p.vendor_id === history.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            return (
              <>
                <div
                  className="modal-head"
                  style={{ borderTop: `3px solid ${tradeColor(history.trade)}` }}
                >
                  <div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.16em',
                        color: tradeColor(history.trade),
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Vendor Account
                    </div>
                    <h2 style={{ marginTop: 6 }}>{history.name}</h2>
                    <div className="sub">
                      {history.trade} · {history.contact}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        setHistory(null);
                        openPdf(history);
                      }}
                    >
                      <Icons.Download size={11} /> PDF
                    </button>
                    <button className="btn-icon" onClick={() => setHistory(null)}>
                      <Icons.X />
                    </button>
                  </div>
                </div>
                <div className="modal-body">
                  <div
                    className="stats-row"
                    style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
                  >
                    <div className="stat">
                      <div className="k">Supplied</div>
                      <div className="v">
                        <Rupee />
                        {fmt(given)}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="k">Paid</div>
                      <div className="v">
                        <Rupee />
                        {fmt(paid)}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="k">
                        {net > 0 ? 'Still Owed' : net < 0 ? 'Overpaid' : 'Settled'}
                      </div>
                      <div
                        className="v"
                        style={{
                          color:
                            net > 0
                              ? 'var(--amber-ink)'
                              : net < 0
                              ? 'var(--green-ink)'
                              : 'var(--ink)',
                        }}
                      >
                        <Rupee />
                        {fmt(Math.abs(net))}
                      </div>
                    </div>
                  </div>
                  <div className="modal-section">
                    <h4>Supplies & work · {rows.length} entries</h4>
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 85 }}>Date</th>
                          <th>Client</th>
                          <th>Description</th>
                          <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 12).map((e) => {
                          const c = d.clients.find((x) => x.id === e.client_id);
                          return (
                            <tr key={e.id}>
                              <td className="mono" style={{ fontSize: 11 }}>
                                {fmtDate(e.date)}
                              </td>
                              <td>{c?.short}</td>
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
                    <h4>Payments made · {payRows.length} entries</h4>
                    {payRows.length === 0 ? (
                      <div className="empty-state">No payments made yet.</div>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ width: 85 }}>Date</th>
                            <th>Note</th>
                            <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payRows.map((p) => (
                            <tr key={p.id}>
                              <td className="mono" style={{ fontSize: 11 }}>
                                {fmtDate(p.date)}
                              </td>
                              <td>{p.note}</td>
                              <td className="num">
                                <Rupee />
                                {fmt(p.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} width={540}>
        {editing && (
          <>
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
                  {isNew ? 'Add vendor' : 'Edit vendor'}
                </div>
                <h2 style={{ marginTop: 6 }}>
                  {isNew ? 'New Vendor' : editing.name}
                </h2>
              </div>
              <button className="btn-icon" onClick={() => setEditing(null)}>
                <Icons.X />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="label">Trade</label>
                  <input
                    className="input"
                    value={editing.trade}
                    onChange={(e) =>
                      setEditing({ ...editing, trade: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="label">Contact</label>
                  <input
                    className="input"
                    value={editing.contact}
                    onChange={(e) =>
                      setEditing({ ...editing, contact: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="form-footer">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save}>
                {isNew ? 'Add vendor' : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!pdfState} onClose={() => setPdfState(null)} width={520}>
        {pdfState && (
          <>
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
                  Export · PDF
                </div>
                <h2 style={{ marginTop: 6 }}>
                  {pdfState.vendor ? pdfState.vendor.name : 'Vendor Statement'}
                </h2>
                <div className="sub">
                  Pick the period — your browser's "Save as PDF" will open.
                </div>
              </div>
              <button className="btn-icon" onClick={() => setPdfState(null)}>
                <Icons.X />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="label">Period</label>
                  <Select
                    value={pdfState.preset}
                    onChange={(v) =>
                      setPdfState((s) => ({ ...s, preset: v }))
                    }
                    options={[
                      { value: '7', label: 'Past 7 days' },
                      { value: '30', label: 'Past 30 days' },
                      { value: '90', label: 'Past 90 days' },
                      { value: 'all', label: 'All time' },
                      { value: 'custom', label: 'Custom range…' },
                    ]}
                  />
                </div>
                {pdfState.preset === 'custom' && (
                  <>
                    <div className="form-group">
                      <label className="label">Start date</label>
                      <DatePicker
                        value={pdfState.start}
                        onChange={(v) =>
                          setPdfState((s) => ({ ...s, start: v }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">End date</label>
                      <DatePicker
                        value={pdfState.end}
                        onChange={(v) =>
                          setPdfState((s) => ({ ...s, end: v }))
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="form-footer">
              <button className="btn btn-ghost" onClick={() => setPdfState(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={runPdf}>
                <Icons.Download /> Generate PDF
              </button>
            </div>
          </>
        )}
      </Modal>

    </>
  );
}
