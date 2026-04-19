const ACCENTS = [
  { hex: '#1f3c6e', label: 'Ink Blue' },
  { hex: '#c9341e', label: 'Red Ink' },
  { hex: '#2f7a3a', label: 'Bottle Green' },
  { hex: '#7446a8', label: 'Aubergine' },
  { hex: '#d4901a', label: 'Saffron' },
  { hex: '#1a8a8a', label: 'Teal' },
  { hex: '#e56a3e', label: 'Coral' },
  { hex: '#181512', label: 'Ink' },
];

export default function Tweaks({ visible, tweaks, setTweaks, onClose }) {
  if (!visible) return null;
  return (
    <div className="tweaks">
      <h4>
        <span>Tweaks</span>
        {onClose && (
          <button
            className="btn-icon"
            onClick={onClose}
            style={{ padding: 2 }}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </h4>
      <div className="tw-group">
        <div className="tw-label">Accent color</div>
        <div className="swatch-row">
          {ACCENTS.map((a) => (
            <div
              key={a.hex}
              className={'swatch' + (tweaks.accent === a.hex ? ' active' : '')}
              title={a.label}
              style={{ background: a.hex }}
              onClick={() => setTweaks({ ...tweaks, accent: a.hex })}
            />
          ))}
        </div>
      </div>
      <div className="tw-group">
        <div className="tw-label">Cell treatment</div>
        <div className="seg">
          {['plain', 'heatmap', 'sparkline'].map((m) => (
            <button
              key={m}
              className={tweaks.cellMode === m ? 'active' : ''}
              onClick={() => setTweaks({ ...tweaks, cellMode: m })}
            >
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
