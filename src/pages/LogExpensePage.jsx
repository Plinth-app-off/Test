import { useRef, useState } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { fmt, fmtDate, today } from '../lib/utils.js';
import { Rupee, Icons } from '../lib/icons.jsx';
import Select from '../components/Select.jsx';
import DatePicker from '../components/DatePicker.jsx';
import ReceiptThumb from '../components/ReceiptThumb.jsx';
import { compressImage, blobToDataURL } from '../lib/compressImage.js';

const FILTERS = [
  { key: '20', label: 'Last 20' },
  { key: '7', label: 'Past 7 days' },
  { key: '30', label: 'Past 30 days' },
  { key: 'all', label: 'All' },
];

function applyFilter(expenses, key) {
  const sorted = expenses.slice().sort((a, b) => b.date.localeCompare(a.date));
  if (key === '20') return sorted.slice(0, 20);
  if (key === 'all') return sorted;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number.parseInt(key, 10));
  const iso = cutoff.toISOString().slice(0, 10);
  return sorted.filter((e) => e.date >= iso);
}

export default function LogExpensePage() {
  const d = useData();
  const activeClients = d.clients.filter((c) => c.active);
  const fileInput = useRef(null);
  const [entryFilter, setEntryFilter] = useState('20');
  const [form, setForm] = useState({
    vendor_id: d.vendors[0]?.id || '',
    client_id: activeClients[0]?.id || '',
    amount: '',
    date: today(),
    description: '',
  });
  const [receipt, setReceipt] = useState(null); // { name, blob, dataUrl, sizeKB }
  const [busy, setBusy] = useState(false);
  const selClient = d.clients.find((c) => c.id === form.client_id);
  const budgetInfo = selClient ? d.getClientExpenses(selClient.id, null) : null;
  const budgetPct =
    selClient && selClient.budget > 0
      ? (budgetInfo.total / selClient.budget) * 100
      : 0;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const blob = await compressImage(f);
      const dataUrl = await blobToDataURL(blob);
      setReceipt({
        name: f.name.replace(/\.[^.]+$/, '') + '.jpg',
        blob,
        dataUrl,
        sizeKB: Math.round(blob.size / 1024),
      });
    } catch (err) {
      console.error(err);
      alert('Could not process image: ' + err.message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const clearReceipt = () => setReceipt(null);

  const submit = async (e) => {
    e?.preventDefault?.();
    const amt = parseFloat(form.amount);
    if (!amt) return;
    setBusy(true);
    try {
      let receipt_url = null;
      if (receipt?.blob) {
        receipt_url = await d.uploadReceipt(receipt.blob, receipt.name);
      }
      await d.addExpense({ ...form, amount: amt, description: form.description || '—', receipt_url });
      setForm((prev) => ({ ...prev, amount: '', description: '' }));
      clearReceipt();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const recent = applyFilter(d.expenses, entryFilter);
  const vendorOpts = d.vendors.map((v) => ({
    value: v.id,
    label: v.name,
    sub: v.trade,
  }));
  const clientOpts = activeClients.map((c) => ({
    value: c.id,
    label: c.short,
    color: c.color,
  }));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="folio">Folio 02 · Journal</div>
          <h1>
            Log an <em>Expense</em>
          </h1>
          <p className="lede">Record a vendor transaction to the ledger.</p>
        </div>
        <div className="page-head-right">
          <span>{recent.length} entries shown</span>
        </div>
      </div>
      <div
        style={{
          padding: '22px 28px 40px',
          display: 'grid',
          gridTemplateColumns: '460px 1fr',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <div className="card">
          <div className="card-head">
            <h3>New entry</h3>
            <span className="folio">Form 02·A</span>
          </div>
          <form onSubmit={submit} style={{ padding: 18 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="label">Vendor</label>
                <Select
                  searchable
                  value={form.vendor_id}
                  onChange={(v) => setForm({ ...form, vendor_id: v })}
                  options={vendorOpts}
                />
              </div>
              <div className="form-group">
                <label className="label">Client / Project</label>
                <Select
                  value={form.client_id}
                  onChange={(v) => setForm({ ...form, client_id: v })}
                  options={clientOpts}
                  renderItem={(o) => (
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
                    >
                      <span className="sh-dot" style={{ background: o.color }} />
                      {o.label}
                    </span>
                  )}
                />
              </div>
              <div className="form-group">
                <label className="label">Amount (₹)</label>
                <input
                  className="input serif-num"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Date</label>
                <DatePicker
                  value={form.date}
                  onChange={(v) => setForm({ ...form, date: v })}
                />
              </div>
              <div className="form-group form-full">
                <label className="label">Description</label>
                <input
                  className="input"
                  placeholder="Rough wiring — ground floor"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group form-full">
                <label className="label">Receipt Photograph</label>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={onFile}
                />
                {receipt ? (
                  <div className="receipt-slot has-file">
                    <div
                      className="thumb"
                      style={{ backgroundImage: `url(${receipt.dataUrl})` }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--ink)' }}>{receipt.name}</div>
                      <div
                        className="mono"
                        style={{ fontSize: 10, color: 'var(--ink-3)' }}
                      >
                        compressed · 50% JPEG · {receipt.sizeKB} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={clearReceipt}
                    >
                      <Icons.X />
                    </button>
                  </div>
                ) : (
                  <div
                    className="receipt-slot"
                    onClick={() => fileInput.current?.click()}
                  >
                    <Icons.Camera size={16} />{' '}
                    {busy ? 'Compressing…' : 'Tap to attach receipt'}
                  </div>
                )}
              </div>
              {selClient && (
                <div className="form-full">
                  {budgetPct >= 100 ? (
                    <div className="warning danger">
                      <Icons.Alert size={14} /> {selClient.short} is{' '}
                      <strong>over budget</strong> — ₹
                      {fmt(budgetInfo.total - selClient.budget)} past limit.
                    </div>
                  ) : budgetPct >= 80 ? (
                    <div className="warning">
                      <Icons.Alert size={14} /> {selClient.short} is at{' '}
                      {Math.round(budgetPct)}% of budget · ₹
                      {fmt(selClient.budget - budgetInfo.total)} remaining.
                    </div>
                  ) : (
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        color: 'var(--ink-3)',
                      }}
                    >
                      {selClient.short} · ₹{fmt(budgetInfo.total)} / ₹
                      {fmt(selClient.budget)} · {Math.round(budgetPct)}% of budget
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
          <div className="form-footer">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setForm({ ...form, amount: '', description: '' })}
            >
              Clear
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              <Icons.Check size={13} /> {busy ? 'Saving…' : 'Enter in ledger'}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ gap: 8, flexWrap: 'wrap' }}>
            <h3>Recent entries</h3>
            <select
              className="input"
              value={entryFilter}
              onChange={(e) => setEntryFilter(e.target.value)}
              style={{ marginLeft: 'auto', width: 'auto', padding: '4px 10px', fontSize: 11, fontFamily: 'var(--mono)' }}
            >
              {FILTERS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Date</th>
                <th>Vendor</th>
                <th>Client</th>
                <th>Description</th>
                <th style={{ width: 50 }}>Rcpt</th>
                <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => {
                const v = d.vendors.find((x) => x.id === e.vendor_id);
                const c = d.clients.find((x) => x.id === e.client_id);
                return (
                  <tr key={e.id}>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {fmtDate(e.date)}
                    </td>
                    <td>{v?.name}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            background: c?.color,
                            borderRadius: '50%',
                          }}
                        />
                        {c?.short}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink-2)' }}>{e.description}</td>
                    <td>
                      <ReceiptThumb src={e.receipt_url} />
                    </td>
                    <td className="num">
                      <Rupee />
                      {fmt(e.amount)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="delete-x"
                        onClick={() => d.deleteExpense(e.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <Icons.Trash size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
