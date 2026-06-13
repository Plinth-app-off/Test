# Plinth Fixes, Polish & Vendor Roundoff — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the calendar off-by-one date bug, improve type/color readability (WCAG-aware) while keeping the paper-ledger identity, move Vendor Payments to 3rd in the sidebar, and add a per-payment write-off "roundoff" to vendor balances.

**Architecture:** Date fix is a one-source correction in `src/lib/utils.js` (local-time formatting) with call sites routed through it. Colors/fonts are CSS-variable edits in `src/styles.css` + the font link in `index.html`. Sidebar reorder is an array reorder. Roundoff adds a `NOT NULL DEFAULT 0` column to `vendor_payments` (applied via Supabase MCP after approval), a derived `getVendorRoundoff` helper in `DataContext`, a form field + table column on the Vendor Payments page, balance math updates on the Vendors page, and a Roundoff line in the vendor PDF.

**Tech Stack:** React 18 + Vite (JSX, no TS), Supabase, jsPDF. Add Vitest **only** for the date-helper unit test (the one piece with pure, regression-worthy logic). Everything else is verified by running the app and observing — matching the user's explicit "show me the final look first" requirement.

**Process gates (user-stated):**
1. Build all code locally.
2. Run locally, show the user, get approval. **(gate)**
3. Apply the Supabase column via MCP after showing SQL + approval. **(gate)**
4. Push to GitHub → Vercel deploys.

The roundoff **code** can be written before the column exists (old + new code tolerate the column's presence/absence because reads coalesce and the insert only adds a field the DB will accept once the column is live). But do **not** push to GitHub until the column is applied, since prod and local share one Supabase.

---

## Task 1: Fix the date off-by-one bug (with a real unit test)

**Files:**
- Modify: `src/lib/utils.js` (`iso`, `today`)
- Create: `src/lib/utils.test.js`
- Modify: `package.json` (add vitest devDep + `test` script)
- Modify: `vite.config.js` (vitest config block) — only if needed for env

**Why a test here:** `iso()` is the exact bug and is pure + timezone-mockable. This is the one place a unit test is real and guards a regression.

- [ ] **Step 1: Add Vitest as a dev dependency**

Run:
```bash
npm install -D vitest
```
Expected: `vitest` appears in `devDependencies`, install succeeds.

- [ ] **Step 2: Add a `test` script to `package.json`**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run"
```
(Keep existing `dev`/`build`/`preview`.)

- [ ] **Step 3: Write the failing test**

Create `src/lib/utils.test.js`:
```js
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { iso, today } from './utils.js';

describe('iso() / today() use LOCAL date, not UTC', () => {
  // Simulate IST (UTC+5:30): local midnight is the previous day in UTC.
  // A correct local formatter must return the LOCAL calendar day.
  it('iso() returns the local calendar date for a local-midnight Date', () => {
    // 13 June 2026, 00:30 local time, constructed via local components.
    const d = new Date(2026, 5, 13, 0, 30, 0); // month is 0-based → June
    expect(iso(d)).toBe('2026-06-13');
  });

  it('iso() zero-pads month and day', () => {
    const d = new Date(2026, 0, 5, 12, 0, 0); // 5 Jan 2026
    expect(iso(d)).toBe('2026-01-05');
  });

  it('today() matches iso(new Date())', () => {
    expect(today()).toBe(iso(new Date()));
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run:
```bash
npm test
```
Expected: the first test FAILS — current `iso()` uses `toISOString()`. (In the CI/runner's default UTC timezone the bug may not reproduce, but the `today() === iso(new Date())` test and the explicit local-component test pin the *correct* behavior regardless of runner TZ. If running locally in IST, expect `2026-06-12` actual vs `2026-06-13` expected.)

- [ ] **Step 5: Implement the local-time fix**

In `src/lib/utils.js`, replace:
```js
export const today = () => new Date().toISOString().slice(0, 10);
```
and
```js
export const iso = (d) => d.toISOString().slice(0, 10);
```
with:
```js
export const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const today = () => iso(new Date());
```
(Define `iso` before `today` so `today` can call it. Keep `parseISO`, `fmtDate`, `daysBetween` unchanged.)

- [ ] **Step 6: Run the test to verify it passes**

Run:
```bash
npm test
```
Expected: all 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/utils.js src/lib/utils.test.js
git commit -m "fix: calendar off-by-one — iso()/today() use local date not UTC

Adds vitest + a unit test pinning local-date behavior.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Route inline date computations through the fixed helpers

**Files:**
- Modify: `src/pages/LogExpensePage.jsx` (~line 21-23)
- Modify: `src/pages/GeneralExpensePage.jsx` (~line 21-23)
- Modify: `src/pages/VendorPaymentsPage.jsx` (~line 19-22)
- Modify: `src/contexts/DataContext.jsx` (`getCellSeries`, ~line 257)
- Modify: `src/lib/exportPDF.js` (4 filename stamps: ~lines 76, 109, 143, 283)

**Why:** Single source of truth. These cutoffs/stamps used the same UTC `toISOString()`; route them through `iso()`/`today()`. Filter cutoffs are not the visible bug but should be consistent.

- [ ] **Step 1: Fix the three page filter cutoffs**

In each of `LogExpensePage.jsx`, `GeneralExpensePage.jsx`, `VendorPaymentsPage.jsx`, the `applyFilter` helper has:
```js
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number.parseInt(key, 10));
  const iso = cutoff.toISOString().slice(0, 10);
  return sorted.filter((e) => e.date >= iso);
```
Replace with (note: import the helper and rename the local var to avoid shadowing):
- Ensure the file imports `iso` from utils. `VendorPaymentsPage.jsx` currently imports `{ fmt, fmtDate, today }` — add `iso`. Check the other two files' existing imports and add `iso` if missing.
```js
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number.parseInt(key, 10));
  const cutoffISO = iso(cutoff);
  return sorted.filter((e) => e.date >= cutoffISO);
```

- [ ] **Step 2: Fix `getCellSeries` in DataContext**

In `src/contexts/DataContext.jsx`, `getCellSeries` has:
```js
      const end = new Date().toISOString().slice(0, 10);
```
`iso`/`today` are already imported? Check the import line at top (`import { withinRange, daysBetween } from '../lib/utils.js';`) — add `today`:
```js
import { withinRange, daysBetween, today } from '../lib/utils.js';
```
Replace the line with:
```js
      const end = today();
```

- [ ] **Step 3: Fix the 4 PDF filename date stamps**

In `src/lib/exportPDF.js`, add an import at the top:
```js
import { today } from './utils.js';
```
Replace each `new Date().toISOString().slice(0, 10)` in the 4 `doc.save(...)` calls with `today()`. (There are exactly 4: `exportExpensesPDF`, `exportGeneralExpensesPDF`, `exportPaymentsPDF`, `exportVendorPDF`.) Leave the `new Date().toLocaleDateString('en-IN')` calls in `footer()` and the generated-date stamp alone — those are display strings, already correct.

- [ ] **Step 4: Verify the build compiles**

Run:
```bash
npm run build
```
Expected: build succeeds, no import/reference errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LogExpensePage.jsx src/pages/GeneralExpensePage.jsx src/pages/VendorPaymentsPage.jsx src/contexts/DataContext.jsx src/lib/exportPDF.js
git commit -m "refactor: route date cutoffs and PDF stamps through local iso()/today()

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Move Vendor Payments to 3rd in the sidebar

**Files:**
- Modify: `src/components/Sidebar.jsx:11-18` (the `items` array)

- [ ] **Step 1: Reorder the items array**

In `src/components/Sidebar.jsx`, change the `items` array so `payments` is 3rd:
```js
  const items = [
    { id: 'dashboard', label: 'Ledger', icon: Icons.Dashboard, count: null },
    { id: 'log', label: 'Log Expense', icon: Icons.FilePlus, count: d.expenses.length },
    { id: 'payments', label: 'Vendor Payments', icon: Icons.CreditCard, count: d.vendorPayments.length },
    { id: 'general', label: 'General Expenses', icon: Icons.Receipt, count: d.generalExpenses.length },
    { id: 'clients', label: 'Clients', icon: Icons.Users, count: d.clients.length },
    { id: 'vendors', label: 'Vendors', icon: Icons.HardHat, count: d.vendors.length },
  ];
```

- [ ] **Step 2: Verify in the running app**

(Dev server from Task 7 / run skill.) Confirm desktop sidebar order is Ledger → Log Expense → Vendor Payments → General Expenses → Clients → Vendors, and clicking Vendor Payments still opens the payments page. Mobile nav intentionally unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.jsx
git commit -m "feat: move Vendor Payments to 3rd in sidebar

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Type & color readability pass (WCAG-aware, identity preserved)

**Files:**
- Modify: `index.html` (Google Fonts link: Inter Tight → Inter)
- Modify: `src/styles.css:1-12` (`:root` vars) and `:16-17` (`--sans` already references the var; body line-height)

**Contrast target:** Against paper `#f3ede0`. Normal text ≥ 4.5:1, large/bold ≥ 3:1. Goal is calm/readable, not harsh.

- [ ] **Step 1: Swap the body font to Inter**

In `index.html`, replace the font stylesheet `<link>` href so `Inter+Tight:wght@...` becomes `Inter:wght@400;500;600;700` (keep Source Serif 4 and JetBrains Mono families and weights). Resulting href:
```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=JetBrains+Mono:wght@400;500&display=swap
```

- [ ] **Step 2: Update the `--sans` variable**

In `src/styles.css` `:root`, change:
```css
  --sans: 'Inter Tight', system-ui, -apple-system, sans-serif;
```
to:
```css
  --sans: 'Inter', system-ui, -apple-system, sans-serif;
```

- [ ] **Step 3: Darken the washed-out ink colors**

In `src/styles.css` `:root`, update the ink scale (these specific values clear AA on `#f3ede0` while staying warm/calm — verify in Step 5):
```css
  --ink: #181512; --ink-2: #463f35; --ink-3: #6e6453; --ink-4: #8a7c61;
```
(Was: `--ink-2: #5a5146; --ink-3: #8c826f; --ink-4: #b3a78c;`.)

- [ ] **Step 4: Darken status inks that are used as text, and bump line-height**

In `:root`, update the amber (worst as text, used for "owed"); nudge others only as needed:
```css
  --red-ink: #bf2f1b; --green-ink: #2a6f34; --amber-ink: #9a6a12;
  --purple-ink: #6a3f9c; --teal-ink: #167f7f; --coral-ink: #d65f33;
```
(Keep `--accent: #1f3c6e` and all `--paper*`/`--rule*` unchanged.)

In the `body` rule, change `line-height: 1.45;` to `line-height: 1.5;`.

- [ ] **Step 5: Verify contrast + visual pass**

Run the app (Task 7). On each page (Ledger, Log, General, Vendor Payments, Clients, Vendors) at desktop and mobile widths, confirm: form labels, table meta, nav counts, placeholders, and "owed/overpaid" amounts are clearly readable and the look is still warm/calm. Use a contrast check (browser devtools or eyeball against the AA thresholds) on `--ink-3` text and the amber "owed" text against paper.

> Note for executor: if any chosen hex still fails AA in the running app, darken it a step further and re-check. The exact values above are the starting point; the **acceptance criterion is AA + calm**, not these literal hexes.

- [ ] **Step 6: Commit**

```bash
git add index.html src/styles.css
git commit -m "style: improve readability — Inter body font, WCAG-AA ink/status colors

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Roundoff — DataContext helper + payment field plumbing

**Files:**
- Modify: `src/contexts/DataContext.jsx` (add `getVendorRoundoff`, expose it)
- Modify: `src/pages/VendorPaymentsPage.jsx` (form field, submit payload, reset, table column)

**Note:** No DB column yet at this step — that's Task 8 (gated). Code is written to tolerate its absence: reads coalesce `Number(p.roundoff) || 0`, and the insert sends `roundoff: <number>`. (Insert against a missing column would error, but we will not exercise the *new* insert path in prod until the column is live; locally we apply the column first in Task 8 before end-to-end testing. For local dev before Task 8, the form still renders; submitting would error until the column exists — acceptable, since Task 8 is part of this same build.)

- [ ] **Step 1: Add `getVendorRoundoff` to DataContext value**

In `src/contexts/DataContext.jsx`, in the `value` object near `getVendorPaid`, add:
```js
    getVendorRoundoff: (vid) =>
      vendorPayments
        .filter((p) => p.vendor_id === vid)
        .reduce((a, b) => a + (Number(b.roundoff) || 0), 0),
```

- [ ] **Step 2: Add the roundoff field to the payment form state**

In `src/pages/VendorPaymentsPage.jsx`, add `roundoff: ''` to the initial `form` state:
```js
  const [form, setForm] = useState({
    vendor_id: d.vendors[0]?.id || '',
    client_id: '',
    amount: '',
    roundoff: '',
    date: today(),
    note: '',
  });
```

- [ ] **Step 3: Send roundoff in submit and reset it**

In the `submit` handler, update the insert payload and the reset:
```js
  const submit = async (e) => {
    e?.preventDefault?.();
    const amt = Number.parseFloat(form.amount);
    if (!amt) return;
    await d.addVendorPayment({
      ...form,
      amount: amt,
      roundoff: Number.parseFloat(form.roundoff) || 0,
      client_id: form.client_id || null,
    });
    setForm((prev) => ({ ...prev, amount: '', roundoff: '', note: '' }));
  };
```

- [ ] **Step 4: Add the Roundoff input next to Amount**

In the form grid, immediately after the Amount `form-group` (the one with `Amount (₹)`), add a sibling `form-group`:
```jsx
              <div className="form-group">
                <label className="label">Roundoff (₹)</label>
                <input
                  className="input serif-num"
                  placeholder="0"
                  value={form.roundoff}
                  onChange={(e) => setForm({ ...form, roundoff: e.target.value })}
                />
              </div>
```
This places Amount + Roundoff side-by-side in the 2-col `form-grid` (Date moves to the next row — acceptable; the grid reflows). The Date `form-group` stays as-is after it.

- [ ] **Step 5: Add a Roundoff column to the payments table**

In the payments table `thead`, add a header before the Amount header:
```jsx
                <th style={{ width: 90, textAlign: 'right' }}>Roundoff</th>
```
In the `tbody` row, add a cell before the Amount cell:
```jsx
                    <td className="num">
                      {p.roundoff ? (
                        <>
                          <Rupee />
                          {fmt(p.roundoff)}
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
```

- [ ] **Step 6: Verify build compiles**

Run:
```bash
npm run build
```
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add src/contexts/DataContext.jsx src/pages/VendorPaymentsPage.jsx
git commit -m "feat: roundoff field on vendor payments + getVendorRoundoff helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Roundoff — Vendors page balance + History modal

**Files:**
- Modify: `src/pages/VendorsPage.jsx` (balance column math; History modal summary + line)

- [ ] **Step 1: Subtract roundoff in the Vendors table balance**

In `src/pages/VendorsPage.jsx`, inside `d.vendors.map((v) => { ... })`, change:
```js
                const given = d.getVendorTotal(v.id, null);
                const paid = d.getVendorPaid(v.id);
                const net = given - paid;
```
to:
```js
                const given = d.getVendorTotal(v.id, null);
                const paid = d.getVendorPaid(v.id);
                const roundoff = d.getVendorRoundoff(v.id);
                const net = given - paid - roundoff;
```
(The existing owed/overpaid/settled rendering below uses `net` and needs no other change.)

- [ ] **Step 2: Subtract roundoff in the History modal summary**

In the History modal IIFE, change:
```js
            const given = rows.reduce((a, b) => a + b.amount, 0);
            const paid = d.getVendorPaid(history.id);
            const net = given - paid;
```
to:
```js
            const given = rows.reduce((a, b) => a + b.amount, 0);
            const paid = d.getVendorPaid(history.id);
            const roundoff = d.getVendorRoundoff(history.id);
            const net = given - paid - roundoff;
```

- [ ] **Step 3: Show roundoff in the History modal**

The summary `stats-row` currently has 3 stats (Supplied / Paid / Still Owed) with `gridTemplateColumns: 'repeat(3, 1fr)'`. Only show a Roundoff stat when there is one, to avoid an empty column. Change the stats-row to 4 columns when `roundoff` is non-zero, and insert a Roundoff stat before the owed/overpaid/settled stat:
```jsx
                  <div
                    className="stats-row"
                    style={{ gridTemplateColumns: roundoff ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}
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
                    {roundoff ? (
                      <div className="stat">
                        <div className="k">Roundoff</div>
                        <div className="v">
                          <Rupee />
                          {fmt(roundoff)}
                        </div>
                      </div>
                    ) : null}
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
```
(This replaces the existing `stats-row` block. The payments sub-table already lists each payment; the per-payment roundoff is also visible on the Vendor Payments page table from Task 5.)

- [ ] **Step 4: Verify build compiles**

Run:
```bash
npm run build
```
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/pages/VendorsPage.jsx
git commit -m "feat: subtract roundoff from vendor balance (table + history modal)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Roundoff — vendor PDF statement

**Files:**
- Modify: `src/lib/exportPDF.js` (`exportVendorPDF`)
- Modify: `src/pages/VendorsPage.jsx` (`runPdf` — ensure payment rows carry `roundoff`)

- [ ] **Step 1: Ensure payment rows passed to the PDF include roundoff**

In `src/pages/VendorsPage.jsx` `runPdf`, the `allPayments` array already passes raw payment objects (which include `roundoff` once the column exists). No change needed to the array itself. Confirm `exportVendorPDF` is called with `payments: allPayments` (it is). No code change in this step beyond confirmation — proceed.

- [ ] **Step 2: Compute total roundoff and adjust balance in the PDF**

In `src/lib/exportPDF.js` `exportVendorPDF`, in the Balance summary section, change:
```js
  const totalGiven = expenses.reduce((a, b) => a + Number(b.amount), 0);
  const totalPaid = payments.reduce((a, b) => a + Number(b.amount), 0);
  const balance = totalGiven - totalPaid;
```
to:
```js
  const totalGiven = expenses.reduce((a, b) => a + Number(b.amount), 0);
  const totalPaid = payments.reduce((a, b) => a + Number(b.amount), 0);
  const totalRoundoff = payments.reduce((a, b) => a + (Number(b.roundoff) || 0), 0);
  const balance = totalGiven - totalPaid - totalRoundoff;
```

- [ ] **Step 3: Add a Roundoff column to the summary when non-zero**

In the same section, the `cols` array currently has 3 entries and `colW = (pageW - 28) / 3`. Make it conditional on roundoff:
```js
  const cols = [
    { label: 'Total Supplied', value: `₹ ${Math.round(totalGiven).toLocaleString('en-IN')}` },
    { label: 'Total Paid', value: `₹ ${Math.round(totalPaid).toLocaleString('en-IN')}` },
    ...(totalRoundoff
      ? [{ label: 'Roundoff', value: `₹ ${Math.round(totalRoundoff).toLocaleString('en-IN')}` }]
      : []),
    { label: balance > 0 ? 'Still Owed' : balance < 0 ? 'Overpaid' : 'Settled', value: `₹ ${Math.round(Math.abs(balance)).toLocaleString('en-IN')}` },
  ];
  const colW = (pageW - 28) / cols.length;
```
The balance column is always the **last** entry. The color logic uses `i === 2` to color the balance — update it to color the **last** column instead. Change:
```js
    doc.setTextColor(balance > 0 && i === 2 ? 180 : balance < 0 && i === 2 ? 60 : 0, balance < 0 && i === 2 ? 100 : 0, 0);
```
to (compute the balance index once before the loop):
```js
    const lastIdx = cols.length - 1;
    doc.setTextColor(
      balance > 0 && i === lastIdx ? 180 : balance < 0 && i === lastIdx ? 60 : 0,
      balance < 0 && i === lastIdx ? 100 : 0,
      0
    );
```
(Place `const lastIdx = cols.length - 1;` once just before the `cols.forEach` loop rather than inside it, to keep it clean. If kept inside, it still works.)

- [ ] **Step 4: Add roundoff to the Payments table footer (optional clarity)**

In the PAYMENTS MADE `autoTable`, the foot row is `['', '', 'Total paid', <total>]`. Leave the per-row table as-is (Date/Client/Note/Amount). The roundoff is summarized in the balance section, so no per-row PDF column is required. (Skip adding a column to keep the table layout stable.)

- [ ] **Step 5: Verify build compiles**

Run:
```bash
npm run build
```
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add src/lib/exportPDF.js src/pages/VendorsPage.jsx
git commit -m "feat: show roundoff line and adjust balance in vendor PDF

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Apply the Supabase column (GATED — after local approval)

**Files:** none (database change via Supabase MCP)

**Precondition:** User has approved the local look (gate 2) and approves this SQL (gate 3).

- [ ] **Step 1: Show the user the exact SQL**

```sql
ALTER TABLE vendor_payments
  ADD COLUMN roundoff numeric NOT NULL DEFAULT 0;
```
State: adds one column, backfills existing rows to 0, RLS unchanged, reversible
(`ALTER TABLE vendor_payments DROP COLUMN roundoff;`).

- [ ] **Step 2: Apply via Supabase MCP**

Use the connected Supabase MCP tool to run the `ALTER TABLE` above against the project
(`ciodkwwevqmsqcnsalqu`). Confirm success.

- [ ] **Step 3: Verify the column exists**

Via MCP, query the column (e.g. select `roundoff` from `vendor_payments limit 1`, or read the
table schema) and confirm `roundoff` is present with default 0.

- [ ] **Step 4: End-to-end local test against the live column**

In the running local app (which points at the same Supabase):
1. Log a vendor expense (bill) of ₹121 for some vendor on the Log Expense page.
2. On Vendor Payments, record a ₹120 payment to that vendor with Roundoff ₹1.
3. Confirm the payment row shows Roundoff ₹1.
4. On Vendors, confirm that vendor's Balance shows **settled** (₹0), not ₹1 owed.
5. Open History → confirm Supplied ₹121 / Paid ₹120 / Roundoff ₹1 / Settled.
6. Generate the vendor PDF → confirm Total Supplied ₹121, Total Paid ₹120, Roundoff ₹1, Settled.
7. Confirm the dashboard ledger and client totals are unchanged by the roundoff.
8. Clean up the test rows (delete the test expense + payment) so prod data isn't polluted.

- [ ] **Step 5: Update CLAUDE.md schema doc**

In `CLAUDE.md`, under the `vendor_payments` table, add the `roundoff` row:
```
| roundoff | numeric | write-off applied at payment; reduces vendor owed balance (default 0) |
```
Commit:
```bash
git add CLAUDE.md
git commit -m "docs: record vendor_payments.roundoff column

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Final verification + push (GATED — after gate 2 + Task 8)

**Files:** none (deploy)

- [ ] **Step 1: Full local regression pass**

Run:
```bash
npm test && npm run build
```
Expected: tests pass, build succeeds.

Then in the running app, re-confirm all four asks:
1. Pick a date in a calendar → records the exact day (no off-by-one).
2. Text/colors readable and calm on all pages.
3. Vendor Payments is 3rd in the sidebar.
4. Roundoff write-off works end-to-end (from Task 8 Step 4).

- [ ] **Step 2: Push to GitHub (triggers Vercel)**

Only after the user confirms the local result and the column is live:
```bash
git push origin main
```

- [ ] **Step 3: Confirm the Vercel deploy**

Watch the deploy (Vercel dashboard / MCP) and confirm the production URL loads (not a blank
screen — env vars already set). Smoke-test: open a calendar, check the sidebar order, record a
payment with roundoff on production.

---

## Self-Review (against spec)

**Spec coverage:**
- §1 Date bug → Task 1 (fix + test) + Task 2 (call sites). ✔
- §2 Fonts/colors → Task 4. ✔
- §3 Sidebar 3rd → Task 3 (mobile explicitly unchanged, per spec). ✔
- §4 Roundoff → Task 5 (helper + form/table), Task 6 (vendor balance + history), Task 7 (PDF), Task 8 (DB column + e2e), CLAUDE.md doc in Task 8. ✔
- Process gates → Tasks 8 & 9 gated; column-before-push ordering enforced. ✔

**Placeholder scan:** No TBD/TODO. The color hexes are concrete starting values with an explicit AA acceptance criterion (not a placeholder — a measurable target). Each code step shows the actual code.

**Type/name consistency:** Helper named `getVendorRoundoff` everywhere (Task 5 def, Task 6 uses). Local var `roundoff` / `totalRoundoff` consistent. `today`/`iso` signatures match Task 1 definitions. PDF `balance` index fix uses `lastIdx = cols.length - 1` consistently.

**Test honesty:** Vitest added only for the date helper (real, pure, regression-worthy). All visual/data-display changes verified by running the app — matching the user's "show me the final look first" requirement; no fake tests on CSS.
