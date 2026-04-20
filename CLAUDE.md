# Plinth — Project Context

Construction finance / account-book web app. Multi-user, Supabase-backed.

## Deployment

- **GitHub repo:** https://github.com/Plinth-app-off/Test (branch: `main`)
- **Vercel project:** `test` — team `plinthforlogins-3504s-projects`
- **Production URL:** https://test-plinthforlogins-3504s-projects.vercel.app
- **Vercel env vars required at build time** (set in Vercel → Settings → Environment Variables, all environments):
  - `VITE_SUPABASE_URL` — Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` — Supabase anon key (safe to expose; RLS enforces per-user access)
- Vite bakes these into the bundle at build time — missing vars = blank screen (createClient throws)

## Tech Stack

- **React 18 + Vite** (JSX, no TypeScript)
- **No React Router** — custom page state in `localStorage` key `sl_page`
- **Supabase** — PostgreSQL + Auth + Storage + Realtime
- **jsPDF + jspdf-autotable** — downloadable PDFs (never `window.print()`)
- CSS variables in `src/styles.css`; no CSS framework

## Environment

```
VITE_SUPABASE_URL=https://ciodkwwevqmsqcnsalqu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Supabase client singleton: `src/lib/supabase.js`

## Provider Tree

```
AuthProvider → ProfileProvider → DataProvider → App
```

All in `src/main.jsx`. Each context is consumed via its own hook:
- `useAuth()` → `{ user, loading, signIn, signUp, signOut }`
- `useProfile()` → `{ profile, loading, saveCompanyName }`
- `useData()` → all data arrays + mutation fns + query helpers

## Supabase Schema

### `clients`
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK auth.users, RLS filter |
| name | text | |
| short | text | short display name (backfilled from name) |
| color | text | hex color |
| started | date | project start date |
| active | boolean | default true |
| created_at | timestamptz | |

### `vendors`
| column | type |
|--------|------|
| id | uuid PK |
| user_id | uuid |
| name | text |
| trade | text |
| contact | text |
| created_at | timestamptz |

### `expenses`
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | |
| vendor_id | uuid | FK vendors |
| client_id | uuid | FK clients |
| date | date | |
| amount | numeric | |
| description | text | |
| receipt_url | text | public URL from Supabase Storage |
| created_at | timestamptz | |

### `general_expenses`
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | |
| client_id | uuid | nullable (site-wide if null) |
| date | date | |
| amount | numeric | |
| category | text | |
| description | text | |
| receipt_url | text | |
| created_at | timestamptz | |

### `vendor_payments`
| column | type |
|--------|------|
| id | uuid PK |
| user_id | uuid |
| vendor_id | uuid |
| client_id | uuid |
| date | date |
| amount | numeric |
| note | text |
| created_at | timestamptz |

### `profiles`
| column | type |
|--------|------|
| id | uuid PK |
| user_id | uuid unique |
| company_name | text |
| created_at | timestamptz |

All tables have RLS enabled with `user_id = auth.uid()` policies for SELECT/INSERT/UPDATE/DELETE.

All 5 main tables are in `supabase_realtime` publication.

### Indexes (applied for 100-user scale)
- `expenses(user_id)`, `expenses(date)`, `expenses(vendor_id)`, `expenses(client_id)`
- `general_expenses(user_id)`, `general_expenses(date)`, `general_expenses(client_id)`
- `vendor_payments(user_id)`, `vendor_payments(date)`, `vendor_payments(vendor_id)`
- `clients(user_id)`, `vendors(user_id)`

## Storage

Bucket: `receipts` (public)
Path pattern: `{user_id}/{timestamp}_{filename}`
Policies: authenticated users can upload/read own files (path starts with `auth.uid()`)

Upload helper in `DataContext`: `uploadReceipt(blob, filename)` → returns public URL.

## Auth Flow

1. `AuthContext` calls `supabase.auth.getSession()` on mount, then subscribes to `onAuthStateChange`
2. `App.jsx` shows `<LoginPage />` if no user, loading spinner while auth/profile loading
3. After login, `ProfileContext` loads the `profiles` row for the user
4. If `profile.company_name` is empty → `<OnboardingModal />` overlay (first login)
5. Company name is shown in sidebar bottom-left (user card), not in brand area

## Real-time Pattern

`DataContext` subscribes to `postgres_changes` for all 5 tables filtered by `user_id`. Handlers are extracted as named functions (not inline) to keep nesting shallow:

```js
const onExpense = (p) => {
  if (p.eventType === 'INSERT') setExpenses((x) => x.some((e) => e.id === p.new.id) ? x : [p.new, ...x]);
  else if (p.eventType === 'DELETE') setExpenses((x) => x.filter((e) => e.id !== p.old.id));
  else if (p.eventType === 'UPDATE') setExpenses((x) => x.map((e) => (e.id === p.new.id ? p.new : e)));
};
```

INSERT handler deduplicates: checks `.some(e => e.id === p.new.id)` before adding, because optimistic local-state update fires first and the real-time event arrives shortly after.

## Mutation Pattern (DataContext)

All mutations are async, write to Supabase first, then update local state optimistically:

```js
const addExpense = async (e) => {
  const { data, error } = await supabase.from('expenses').insert({ ...e, user_id: user.id }).select().single();
  if (error) { alert(error.message); return; }
  setExpenses((x) => [data, ...x]);
};
```

Pages call mutations fire-and-forget. DataContext handles errors with `alert()`.

## Image Compression

`src/lib/compressImage.js` — compresses to JPEG blob before upload:
- Max edge: 1200px
- Starting quality: 0.72
- Iterative: reduces quality by 0.6× up to 3 times if blob > 400KB
- Min quality floor: 0.3

Usage in log forms: `const blob = await compressImage(file); const url = await d.uploadReceipt(blob, file.name);`

## PDF Export

`src/lib/exportPDF.js` — all functions use jsPDF + autoTable, save as file download.

| Function | Usage |
|----------|-------|
| `exportExpensesPDF` | vendor expenses journal |
| `exportGeneralExpensesPDF` | overhead expenses journal |
| `exportPaymentsPDF` | vendor payments journal |
| `exportVendorPDF` | per-vendor statement with supplies + payments + balance summary |

`exportVendorPDF` accepts `{ vendor, expenses, payments, clients, periodLabel, companyName, userEmail }`. Company name appears top-right. Balance summary shows Total Supplied / Total Paid / Still Owed (or Overpaid / Settled).

PDF download is only on **VendorsPage** (individual vendor). Other pages do not have PDF export buttons.

## Filter Pattern

Pages use a `FILTERS` array and an `applyFilter(rows, f)` helper from `src/lib/utils.js`. Filter options: `7d`, `30d`, `90d`, `all` (default). Rendered as a `<select>` dropdown.

## File Structure

```
src/
  App.jsx                    — page routing, auth gate, onboarding trigger
  main.jsx                   — provider tree
  styles.css                 — all CSS, design tokens as CSS vars
  contexts/
    AuthContext.jsx           — Supabase auth state
    ProfileContext.jsx        — profiles table (company name)
    DataContext.jsx           — all data + mutations + query helpers + realtime
  pages/
    LoginPage.jsx             — sign in / sign up
    Dashboard.jsx             — ledger overview
    LogExpensePage.jsx        — add vendor expense
    GeneralExpensePage.jsx    — add general/overhead expense
    VendorPaymentsPage.jsx    — log vendor payment
    ClientsPage.jsx           — manage clients
    VendorsPage.jsx           — manage vendors + per-vendor PDF
  components/
    Sidebar.jsx               — left nav; brand "Plinth" top, user card bottom
    OnboardingModal.jsx       — first-login company name capture
    Modal.jsx, Popover.jsx, Select.jsx, DatePicker.jsx, DateRangePicker.jsx
    BudgetBar.jsx, Sparkline.jsx, ReceiptThumb.jsx, Calendar.jsx
    Switch.jsx, Tweaks.jsx
  lib/
    supabase.js               — client singleton
    exportPDF.js              — jsPDF export functions
    compressImage.js          — canvas JPEG compression
    utils.js                  — withinRange, daysBetween, etc.
    icons.jsx                 — SVG icon components
  data/
    seed.js                   — dev seed data (not used in prod)
```

## Design System (CSS Variables)

Key vars: `--paper`, `--ink`, `--ink-2`, `--ink-3`, `--accent`, `--rule`, `--radius`, `--serif`, `--sans`, `--mono`

Card pattern: `<div className="card">` with `.card-head` header. Buttons: `.btn`, `.btn-primary`, `.btn-sm`. Form: `.form-group`, `.label`, `.input`.

Nav items are `<button className="nav-item">` with full CSS reset (no browser default border/bg).

## Key Decisions

- **No React Router**: page kept in `localStorage`; simple for single-user-per-tab app
- **Optimistic UI + real-time dedup**: mutations update state immediately; real-time events deduplicate via `id` check
- **Receipt as URL not base64**: uploaded to Supabase Storage, public URL stored in DB
- **jsPDF for all PDFs**: `window.print()` was removed from VendorsPage; only `exportVendorPDF()` is used
- **Company name not in brand**: only shown in sidebar user card (bottom left)
- **alert() for DB errors**: simple; no toast system
