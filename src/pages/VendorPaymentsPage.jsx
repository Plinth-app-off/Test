import { useState } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { fmt, fmtDate, today } from '../lib/utils.js';
import { Rupee, Icons } from '../lib/icons.jsx';
import Select from '../components/Select.jsx';
import DatePicker from '../components/DatePicker.jsx';

const FILTERS = [
  { key: '20', label: 'Last 20' },
  { key: '7', label: 'Past 7 days' },
  { key: '30', label: 'Past 30 days' },
  { key: 'all', label: 'All' },
];

function applyFilter(rows, key) {
  const sorted = rows.slice().sort((a, b) => b.date.localeCompare(a.date));
  if (key === '20') return sorted.slice(0, 20);
  if (key === 'all') return sorted;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number.parseInt(key, 10));
  const iso = cutoff.toISOString().slice(0, 10);
  return sorted.filter((e) => e.date >= iso);
}

export default function VendorPaymentsPage() {
  const d = useData();
  const [entryFilter, setEntryFilter] = useState('20');
  const [form, setForm] = useState({
    vendor_id: d.vendors[0]?.id || '',
    client_id: '',
    amount: '',
    date: today(),
    note: '',
  });

  const submit = async (e) => {
    e?.preventDefault?.();
    const amt = Number.parseFloat(form.amount);
    if (!amt) return;
    await d.addVendorPayment({
      ...form,
      amount: amt,
      client_id: form.client_id || null,
    });
    setForm((prev) => ({ ...prev, amount: '', note: '' }));
  };

  const rows = applyFilter(d.vendorPayments, entryFilter);
  const total = rows.reduce((a, b) => a + b.amount, 0);
  const vendorOpts = d.vendors.map((v) => ({
    value: v.id,
    label: v.name,
    sub: v.trade,
  }));
  const clientOpts = [
    { value: '', label: '— None —' },
    ...d.clients
      .filter((c) => c.active)
      .map((c) => ({ value: c.id, label: c.short, color: c.color })),
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="folio">Folio 04 · Settlements</div>
          <h1>
            Vendor <em>Payments</em>
          </h1>
          <p className="lede">
            Money paid <em>to</em> vendors — settling supplies and work already given on credit.
          </p>
        </div>
        <div className="page-head-right">
          <span>
            <Rupee />
            {fmt(total)} paid out
          </span>
        </div>
      </div>
      <div
        style={{
          padding: '22px 28px 40px',
          display: 'grid',
          gridTemplateColumns: '420px 1fr',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <div className="card">
          <div className="card-head">
            <h3>Record a payment</h3>
            <span className="folio">Form 04·A</span>
          </div>
          <form onSubmit={submit} style={{ padding: 18 }}>
            <div className="form-grid">
              <div className="form-group form-full">
                <label className="label">To Vendor</label>
                <Select
                  searchable
                  value={form.vendor_id}
                  onChange={(v) => setForm({ ...form, vendor_id: v })}
                  options={vendorOpts}
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
                <label className="label">Related Client (optional)</label>
                <Select
                  value={form.client_id}
                  onChange={(v) => setForm({ ...form, client_id: v })}
                  options={clientOpts}
                  renderItem={(o) =>
                    o.color ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                        }}
                      >
                        <span className="sh-dot" style={{ background: o.color }} />
                        {o.label}
                      </span>
                    ) : (
                      o.label
                    )
                  }
                />
              </div>
              <div className="form-group form-full">
                <label className="label">Note</label>
                <input
                  className="input"
                  placeholder="Part payment for Koregaon Park wiring"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
          </form>
          <div className="form-footer">
            <button className="btn btn-primary" onClick={submit}>
              <Icons.Check size={13} /> Record payment
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ gap: 8, flexWrap: 'wrap' }}>
            <h3>Payments made</h3>
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
                <th>Note</th>
                <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const v = d.vendors.find((x) => x.id === p.vendor_id);
                const c = d.clients.find((x) => x.id === p.client_id);
                return (
                  <tr key={p.id}>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {fmtDate(p.date)}
                    </td>
                    <td>{v?.name}</td>
                    <td>
                      {c ? c.short : <span className="muted italic">—</span>}
                    </td>
                    <td style={{ color: 'var(--ink-2)' }}>{p.note}</td>
                    <td className="num">
                      <Rupee />
                      {fmt(p.amount)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="delete-x"
                        onClick={() => d.deleteVendorPayment(p.id)}
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
