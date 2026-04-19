import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Popover({
  triggerRef,
  open,
  onClose,
  align = 'left',
  matchTriggerWidth = false,
  children,
}) {
  const popRef = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999, minWidth: undefined });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const compute = () => {
      if (!triggerRef.current || !popRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const popW = popRef.current.offsetWidth || 280;
      const popH = popRef.current.offsetHeight || 320;
      let top = r.bottom + 4;
      let left = align === 'right' ? r.right - popW : r.left;
      // clamp horizontally
      if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
      if (left < 8) left = 8;
      // flip above if no room below
      if (top + popH > window.innerHeight - 8 && r.top - popH - 4 > 8) {
        top = r.top - popH - 4;
      }
      setPos({
        top: top + window.scrollY,
        left: left + window.scrollX,
        minWidth: matchTriggerWidth ? r.width : undefined,
      });
    };
    compute();
    // recompute on resize / scroll
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, align, matchTriggerWidth, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        popRef.current &&
        !popRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose?.();
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;
  return createPortal(
    <div
      ref={popRef}
      className="popover"
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        minWidth: pos.minWidth,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
