export const fmt = (n) =>
  n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('en-IN');

export const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
};

export const today = () => new Date().toISOString().slice(0, 10);

export const daysBetween = (a, b) =>
  Math.round((new Date(b) - new Date(a)) / 86400000);

export const withinRange = (d, f) => {
  if (!f) return true;
  if (f.start && d < f.start) return false;
  if (f.end && d > f.end) return false;
  return true;
};

export const iso = (d) => d.toISOString().slice(0, 10);
export const parseISO = (s) => (s ? new Date(s + 'T00:00:00') : null);
export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const addMonths = (d, n) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);

export const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const tradeColor = (t) =>
  ({
    Electrical: '#d4901a',
    Plumbing: '#1a8a8a',
    Carpentry: '#c9341e',
    'Stone & Tile': '#7446a8',
    Painting: '#2f7a3a',
    Hardware: '#5a5146',
    Metalwork: '#1f3c6e',
    Glazing: '#e56a3e',
  }[t] || '#8c826f');

export const catColor = (c) =>
  ({
    Transport: '#1a8a8a',
    'Permits & Fees': '#1f3c6e',
    'Food & Refreshments': '#d4901a',
    Labour: '#c9341e',
    'Tools & Equipment': '#7446a8',
    Utilities: '#2f7a3a',
    Miscellaneous: '#8c826f',
  }[c] || '#5a5146');

export const CATEGORIES = [
  'Labour',
  'Transport',
  'Permits & Fees',
  'Tools & Equipment',
  'Food & Refreshments',
  'Utilities',
  'Miscellaneous',
];

export const heatClass = (amt, max) => {
  if (!amt) return '';
  const r = amt / max;
  if (r >= 0.7) return 'heat-5';
  if (r >= 0.45) return 'heat-4';
  if (r >= 0.25) return 'heat-3';
  if (r >= 0.12) return 'heat-2';
  return 'heat-1';
};

export const nid = (p) => p + '_' + Math.random().toString(36).slice(2, 8);
