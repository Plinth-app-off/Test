import { useEffect, useRef, useState } from 'react';
import Popover from './Popover.jsx';
import { Icons } from '../lib/icons.jsx';

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = false,
  small = false,
  renderItem,
}) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const filtered =
    searchable && q
      ? options.filter((o) =>
          (o.label || '').toLowerCase().includes(q.toLowerCase())
        )
      : options;
  useEffect(() => {
    if (!open) {
      setQ('');
      setHi(0);
    }
  }, [open]);
  const selected = options.find((o) => o.value === value);
  const pick = (o) => {
    onChange(o.value);
    setOpen(false);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[hi]) pick(filtered[hi]);
    }
  };
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={'sh-trigger' + (small ? ' small' : '')}
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={selected ? '' : 'placeholder'}
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selected
            ? renderItem
              ? renderItem(selected, true)
              : selected.label
            : placeholder}
        </span>
        <Icons.ChevronDown />
      </button>
      <Popover
        triggerRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        matchTriggerWidth
      >
        <div onKeyDown={onKey}>
          {searchable && (
            <div className="sh-search">
              <Icons.Search />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setHi(0);
                }}
                placeholder="Search…"
              />
            </div>
          )}
          <div className="sh-list">
            {filtered.length === 0 ? (
              <div className="sh-empty">No results</div>
            ) : (
              filtered.map((o, i) => (
                <div
                  key={o.value}
                  className="sh-item"
                  data-highlighted={i === hi}
                  data-selected={o.value === value}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(o)}
                >
                  <Icons.CheckSm />
                  <span style={{ flex: 1 }}>
                    {renderItem ? renderItem(o, false) : o.label}
                  </span>
                  {o.sub && <span className="sh-item-sub">{o.sub}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </Popover>
    </>
  );
}
