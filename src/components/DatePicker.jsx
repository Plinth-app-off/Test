import { useEffect, useRef, useState } from 'react';
import Calendar from './Calendar.jsx';
import Popover from './Popover.jsx';
import { Icons } from '../lib/icons.jsx';
import { fmtDate, parseISO } from '../lib/utils.js';

export default function DatePicker({ value, onChange, placeholder = 'Pick a date' }) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => (value ? parseISO(value) : new Date()));
  useEffect(() => {
    if (value) setMonth(parseISO(value));
  }, [value]);
  const pick = (s) => {
    onChange(s);
    setOpen(false);
  };
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="sh-trigger"
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? '' : 'placeholder'}>
          {value ? fmtDate(value) : placeholder}
        </span>
        <Icons.Cal />
      </button>
      <Popover triggerRef={triggerRef} open={open} onClose={() => setOpen(false)}>
        <Calendar
          month={month}
          setMonth={setMonth}
          selected={value}
          onSelect={pick}
        />
      </Popover>
    </>
  );
}
