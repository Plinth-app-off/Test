# Plinth — Bug Fixes, UI Polish & Vendor Roundoff

**Date:** 2026-06-13
**Status:** Approved (design)

Four changes, bundled. Three are low-risk fixes/polish; one (roundoff) adds a feature
that touches the data layer. No existing user data is modified. The only backend change
is a new nullable column.

## Process constraint (user-stated)

Build everything, run locally and show the result first, get approval, **then** push to
GitHub (which triggers the Vercel deploy). The Supabase column is applied via Supabase MCP
**after** the user approves the SQL — and it must exist before the new code runs against
production, because local and prod share the same Supabase project.

---

## 1. Date off-by-one bug

### Symptom
Selecting any date in a calendar (DatePicker / DateRangePicker) records/displays the
**previous** day.

### Root cause
`iso()` in `src/lib/utils.js` uses `toISOString()`, which serializes in **UTC**. The
calendar constructs each day with the local-time constructor `new Date(year, month, d)`.
For a user east of UTC (IST = UTC+5:30), local midnight maps to the previous day in UTC,
so `toISOString().slice(0,10)` yields yesterday. `today()` has the identical flaw, which
also makes the default date in every form wrong.

### Fix
Rewrite `iso()` and `today()` in `src/lib/utils.js` to format from **local** components
(`getFullYear` / `getMonth`+1 / `getDate`, zero-padded). One shared correct implementation;
`today()` is defined in terms of `iso()`.

Route the existing inline `cutoff.toISOString().slice(0,10)` filter computations and the
PDF-filename date stamps through `iso()` / `today()` so there is a single source of truth:
- `src/pages/LogExpensePage.jsx`, `src/pages/GeneralExpensePage.jsx`,
  `src/pages/VendorPaymentsPage.jsx` (filter cutoffs)
- `src/contexts/DataContext.jsx` `getCellSeries` (`end` date)
- `src/lib/exportPDF.js` (4 filename stamps)

Leave `parseISO` (already local via `'T00:00:00'`), `fmtDate`, and `daysBetween` as-is —
they operate on date-only strings where the parse is symmetric. `src/data/seed.js` is
dev-only and out of scope.

### Data impact
None. Existing rows are not touched; this only corrects the date written/selected from now
on. (It removes a pre-existing source of slightly-wrong dates.)

### Verification
In the running app, open a DatePicker, click a specific day, confirm the trigger shows that
exact day. Confirm a new payment/expense saves with the clicked date. Confirm the "today"
dot in the calendar lands on the correct day.

---

## 2. Fonts & colors — readability, calm, WCAG-aware

User direction: "you decide" + earlier stated goal "visible and calm, not eye-straining."
Keep the warm paper-ledger identity; fix genuine contrast failures.

### Changes (all in `src/styles.css` `:root`, plus the font link in `index.html`)
- **Body font:** `Inter Tight` → `Inter`. Inter Tight is condensed and hurts legibility at
  the 13px body size; Inter is the legibility-tuned cut. Serif (`Source Serif 4`) headings
  and mono (`JetBrains Mono`) stay — they define the brand and read fine.
- **Contrast fixes** on the `#f3ede0` paper background (current greys fail WCAG AA as text):
  - `--ink-2` `#5a5146` → darkened (`#463f35` range) — secondary body text.
  - `--ink-3` `#8c826f` → darkened to clear AA (~`#6e6453`) — labels, meta, counts (used
    pervasively; this is the biggest readability win).
  - `--ink-4` `#b3a78c` → darkened (~`#938567`) — placeholders/disabled; still clearly
    "muted" but no longer washed out.
  - Status inks used as **text** on paper nudged for legibility where needed:
    `--amber-ink` `#d4901a` is the worst offender as text (used for "owed") → darken toward
    `#9a6a12`. Re-check `--green-ink`, `--red-ink`, `--teal-ink`, `--coral-ink` and darken
    only if they fail as text.
- **Line-height:** body `1.45` → `1.5` for calmer reading.

Keep `--paper*`, `--rule*`, `--accent`, radii unchanged — the character stays.

### Constraint
Verify against WCAG AA (≥4.5:1 for normal text, ≥3:1 for large/bold) using the actual paper
background. Don't over-darken — the goal is calm, not harsh black-on-white.

### Verification
Visual pass on every page (Ledger, Log, General, Vendor Payments, Clients, Vendors) at
desktop + mobile widths. Spot-check the previously-washed-out spots: form labels, table
meta, nav counts, "owed" amounts, placeholders.

---

## 3. Move "Vendor Payments" to 3rd in the sidebar

Reorder the `items` array in `src/components/Sidebar.jsx`:

`Ledger → Log Expense → Vendor Payments → General Expenses → Clients → Vendors`

### Mobile
`src/components/MobileNav.jsx` has a different, intentional layout (5 tab slots + center
FAB for Log Expense; Vendor Payments lives in the overflow "Settlements" menu item). It does
**not** mirror the sidebar order and has no free slot. Leave mobile unchanged — the request
was about the left sidebar. Noted here so the discrepancy is intentional, not an oversight.

### Verification
Desktop sidebar shows Vendor Payments in the 3rd position; navigation still works.

---

## 4. Roundoff on vendor payments (per-payment write-off)

### Behaviour (confirmed)
- A **roundoff** is entered **per payment**, next to Amount, on the Record-a-payment form.
- Roundoff is a **write-off**: it reduces what the vendor is owed.
  `pending = supplied − Σ(paid) − Σ(roundoff)`.
  Example: bill ₹121, pay ₹120, roundoff ₹1 → vendor shows **settled** (₹0 pending).
- Visible on demand: payments table, vendor History modal, and vendor PDF.
- **Scope:** vendor side only. Not on the client side, not on the dashboard ledger, not in
  either expense logger. Roundoff never affects client totals or expense records.

### Data model
Add column to `vendor_payments`:

```sql
ALTER TABLE vendor_payments
  ADD COLUMN roundoff numeric NOT NULL DEFAULT 0;
```

`NOT NULL DEFAULT 0` — `DEFAULT 0` backfills existing rows safely (no nulls created); the
`NOT NULL` keeps the math clean (code still coalesces defensively). RLS unchanged (column
inherits the table's row policies). Applied via Supabase MCP **after** user approves the SQL.

`vendor_payments` is in the `supabase_realtime` publication, so realtime payloads will carry
`roundoff` automatically.

### Code changes
- **`src/contexts/DataContext.jsx`**
  - `addVendorPayment` already spreads the payment object, so `roundoff` flows through; ensure
    the page sends a numeric `roundoff` (default 0).
  - Add helper `getVendorRoundoff(vid)` = `Σ roundoff` over that vendor's payments
    (coalesce `Number(p.roundoff) || 0`).
- **`src/pages/VendorPaymentsPage.jsx`**
  - Add **Roundoff (₹)** input next to Amount (optional, numeric, default empty→0).
  - Include `roundoff: Number.parseFloat(form.roundoff) || 0` in the submit payload; reset
    it after submit.
  - Add a **Roundoff** column to the payments table (show `—` when 0) so it's visible.
- **`src/pages/VendorsPage.jsx`**
  - Balance column: `net = given − paid − roundoff` (via `getVendorRoundoff`). Settled /
    owed / overpaid logic unchanged otherwise.
  - History modal: subtract roundoff in the summary; add a small "Roundoff" stat or line so
    the user can see it. Payments sub-table shows the per-payment roundoff.
- **`src/lib/exportPDF.js` `exportVendorPDF`**
  - Accept roundoff (either pass `totalRoundoff` in, or include `roundoff` on the payment
    rows and sum it). Add a "Roundoff" line and compute
    `balance = totalGiven − totalPaid − totalRoundoff`. Caller in `VendorsPage.runPdf`
    passes payment rows that include `roundoff`.

### Edge cases
- Empty roundoff → 0.
- Negative roundoff: not expected; treat as a normal number (don't add validation friction).
  Math still holds (a negative roundoff would *increase* owed).
- Deleting a payment removes its roundoff from the sum (already handled — sum is derived).

### Verification
- Create a vendor expense (bill) of ₹121 on the Log page.
- Record a ₹120 payment with ₹1 roundoff on the Vendor Payments page.
- Vendors page balance for that vendor shows **settled** (₹0), not ₹1 owed.
- Roundoff visible in the payments table and the History modal.
- Generate the vendor PDF: shows Total Supplied ₹121, Total Paid ₹120, Roundoff ₹1,
  balance Settled.
- Confirm client totals / dashboard ledger are unchanged by the roundoff.

---

## Out of scope
- No change to client-side balances, dashboard ledger, or expense loggers (beyond the date
  helper routing).
- No mobile nav reorder.
- No refactors beyond consolidating the date helpers.

## Rollout order
1. Build all code changes locally.
2. Run locally, show the user, get approval. **(gate)**
3. Apply the Supabase column via MCP after showing SQL + approval. **(gate)**
4. Push to GitHub → Vercel deploys.
