import { useState } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { fmt, fmtDate, today } from '../lib/utils.js';
import { Rupee, Icons } from '../lib/icons.jsx';
import Modal from '../components/Modal.jsx';
import Switch from '../components/Switch.jsx';
import BudgetBar from '../components/BudgetBar.jsx';

export default function ClientsPage() {
  const d = useData();
  const [editing, setEditing] = useState(null);
  const isNew = editing && !editing.id;

  const save = () => {
    if (!editing.name) return;
    if (isNew) {
      d.addClient({
        name: editing.name,
        short: editing.name,
        budget: parseFloat(editing.budget) || 0,
        notes: editing.notes,
        color: '#1f3c6e',
        started: today(),
      });
    } else {
      d.updateClient(editing.id, {
        name: editing.name,
        short: editing.short || editing.name,
        budget: parseFloat(editing.budget) || 0,
        notes: editing.notes,
      });
    }
    setEditing(null);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="folio">Folio 05 · Accounts</div>
          <h1>
            <em>Clients</em>
          </h1>
          <p className="lede">Budgets, balances, and the state of each project.</p>
        </div>
        <div className="page-head-right">
          <button
            className="btn btn-primary"
            onClick={() => setEditing({ name: '', budget: 0, notes: '' })}
          >
            <Icons.Plus size={13} /> New client
          </button>
        </div>
      </div>
      <div style={{ padding: '22px 28px 40px' }}>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th style={{ width: 140, textAlign: 'right' }}>Budget</th>
                <th style={{ width: 140, textAlign: 'right' }}>Spent</th>
                <th style={{ width: 240 }}>Remaining</th>
                <th style={{ width: 90 }}>Status</th>
                <th>Notes</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {d.clients.map((c) => {
                const sp = d.getClientExpenses(c.id, null).total;
                const rem = c.budget - sp;
                return (
                  <tr key={c.id}>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            background: c.color,
                            borderRadius: '50%',
                            boxShadow: `0 0 0 2px ${c.color}33`,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>
                            {c.short}
                          </div>
                          <div
                            className="mono"
                            style={{ fontSize: 10, color: 'var(--ink-3)' }}
                          >
                            opened {fmtDate(c.started)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      <Rupee />
                      {fmt(c.budget)}
                    </td>
                    <td className="num">
                      <Rupee />
                      {fmt(sp)}
                    </td>
                    <td>
                      <div
                        style={{
                          fontFamily: 'var(--serif)',
                          fontSize: 14,
                          color: rem < 0 ? 'var(--red-ink)' : 'var(--green-ink)',
                          textAlign: 'right',
                          fontWeight: 500,
                        }}
                      >
                        {rem < 0 ? '−' : ''}
                        <Rupee />
                        {fmt(Math.abs(rem))}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <BudgetBar spent={sp} budget={c.budget} />
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Switch on={c.active} onChange={() => d.toggleClient(c.id)} />
                        <span
                          className="mono"
                          style={{
                            fontSize: 10,
                            color: c.active ? 'var(--green-ink)' : 'var(--ink-3)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        color: 'var(--ink-2)',
                        fontSize: 11.5,
                        fontStyle: 'italic',
                        fontFamily: 'var(--serif)',
                        maxWidth: 280,
                      }}
                    >
                      {c.notes || <span className="muted">—</span>}
                    </td>
                    <td>
                      <span
                        className="delete-x"
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            name: c.name,
                            short: c.short,
                            budget: c.budget,
                            notes: c.notes,
                          })
                        }
                      >
                        <Icons.Edit size={13} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
                  {isNew ? 'Open new account' : 'Edit client'}
                </div>
                <h2 style={{ marginTop: 6 }}>
                  {isNew ? 'New Client Account' : editing.name}
                </h2>
              </div>
              <button className="btn-icon" onClick={() => setEditing(null)}>
                <Icons.X />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="label">Client Name</label>
                  <input
                    className="input"
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group form-full">
                  <label className="label">Budget (₹)</label>
                  <input
                    className="input serif-num"
                    value={editing.budget}
                    onChange={(e) =>
                      setEditing({ ...editing, budget: e.target.value })
                    }
                  />
                </div>
                <div className="form-group form-full">
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={editing.notes || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, notes: e.target.value })
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
                {isNew ? 'Open account' : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
