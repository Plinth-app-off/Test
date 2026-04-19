import { useEffect, useState } from 'react';

export default function ReceiptThumb({ src, size = 28 }) {
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoom(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  if (!src) return <span className="muted">—</span>;

  return (
    <>
      <div
        className="receipt-thumb"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={(e) => {
          e.stopPropagation();
          setZoom(true);
        }}
        title="View receipt"
      />
      {zoom && (
        <div
          className="modal-overlay"
          onClick={() => setZoom(false)}
          style={{ padding: 40 }}
        >
          <img
            src={src}
            alt="receipt"
            style={{
              maxWidth: '90vw',
              maxHeight: '86vh',
              border: '4px solid var(--paper)',
              boxShadow: '0 20px 60px rgba(20,14,8,0.5)',
              background: 'var(--paper)',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
