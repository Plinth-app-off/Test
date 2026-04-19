import { Icons } from '../lib/icons.jsx';
import { iso, startOfMonth, addMonths, DOW, MONTHS } from '../lib/utils.js';

export default function Calendar({
  month,
  setMonth,
  selected,
  onSelect,
  rangeStart,
  rangeEnd,
  onRangeChange,
}) {
  const first = startOfMonth(month);
  const firstDow = first.getDay();
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today_iso = iso(new Date());
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++)
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  const isRange = onRangeChange != null;
  const cellClass = (d) => {
    if (!d) return 'outside';
    const s = iso(d);
    let c = '';
    if (s === today_iso) c += ' today';
    if (isRange) {
      if (rangeStart && s === rangeStart) c += ' selected range-start';
      if (rangeEnd && s === rangeEnd) c += ' selected range-end';
      if (rangeStart && rangeEnd && s > rangeStart && s < rangeEnd) c += ' in-range';
    } else if (selected && s === selected) c += ' selected';
    return c.trim();
  };
  const onDay = (d) => {
    if (!d) return;
    const s = iso(d);
    if (isRange) {
      if (!rangeStart || (rangeStart && rangeEnd)) onRangeChange({ start: s, end: null });
      else if (s < rangeStart) onRangeChange({ start: s, end: rangeStart });
      else onRangeChange({ start: rangeStart, end: s });
    } else {
      onSelect(s);
    }
  };
  return (
    <div className="cal">
      <div className="cal-head">
        <div className="cal-title">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </div>
        <div className="cal-nav">
          <button type="button" onClick={() => setMonth(addMonths(month, -1))}>
            <Icons.ChevronL />
          </button>
          <button type="button" onClick={() => setMonth(addMonths(month, 1))}>
            <Icons.ChevronR />
          </button>
        </div>
      </div>
      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            disabled={!d}
            className={'cal-day ' + cellClass(d)}
            onClick={() => onDay(d)}
          >
            {d ? d.getDate() : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
