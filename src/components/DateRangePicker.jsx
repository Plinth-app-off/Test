import { useEffect, useRef, useState } from 'react';
import Calendar from './Calendar.jsx';
import Popover from './Popover.jsx';
import { Icons } from '../lib/icons.jsx';
import { fmtDate, iso, parseISO } from '../lib/utils.js';

export default function DateRangePicker({
  range,
  onChange,
  presets = true,
  placeholder = 'Pick a range',
}) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    range?.start ? parseISO(range.start) : new Date()
  );
  const [tmp, setTmp] = useState(range || { start: null, end: null });
  useEffect(() => {
    setTmp(range || { start: null, end: null });
  }, [range, open]);
  const apply = (r) => {
    onChange(r);
    setOpen(false);
  };
  const setPreset = (days) => {
    const end = iso(new Date());
    const d = new Date();
    d.setDate(d.getDate() - days);
    const start = iso(d);
    apply({ start, end, preset: String(days) });
  };
  const label =
    tmp.start && tmp.end
      ? `${fmtDate(tmp.start)} — ${fmtDate(tmp.end)}`
      : tmp.start
      ? `${fmtDate(tmp.start)} — …`
      : range?.start && range?.end
      ? `${fmtDate(range.start)} — ${fmtDate(range.end)}`
      : placeholder;
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="sh-trigger"
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen((o) => !o)}
        style={{ minWidth: 260 }}
      >
        <Icons.Cal />
        <span className={range?.start ? '' : 'placeholder'} style={{ flex: 1 }}>
          {label}
        </span>
        <Icons.ChevronDown />
      </button>
      <Popover
        triggerRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        align="right"
      >
        <div style={{ display: 'flex' }}>
          {presets && (
            <div className="cal-preset">
              <button type="button" onClick={() => setPreset(7)}>
                Last 7 days
              </button>
              <button type="button" onClick={() => setPreset(30)}>
                Last 30 days
              </button>
              <button type="button" onClick={() => setPreset(90)}>
                Last 90 days
              </button>
              <button
                type="button"
                onClick={() => apply({ start: null, end: null, preset: 'all' })}
              >
                All time
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={() => apply(tmp)}
                style={{
                  background: 'var(--accent)',
                  color: 'var(--paper)',
                  fontWeight: 500,
                }}
              >
                Apply
              </button>
            </div>
          )}
          <Calendar
            month={month}
            setMonth={setMonth}
            rangeStart={tmp.start}
            rangeEnd={tmp.end}
            onRangeChange={setTmp}
          />
        </div>
      </Popover>
    </>
  );
}
