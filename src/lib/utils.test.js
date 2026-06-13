import { describe, it, expect } from 'vitest';
import { iso, today } from './utils.js';

describe('iso() / today() use LOCAL date, not UTC', () => {
  // For a user east of UTC (IST = UTC+5:30), local midnight maps to the
  // PREVIOUS day in UTC. A correct local formatter must return the local
  // calendar day regardless of timezone — this pins that behavior.
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
