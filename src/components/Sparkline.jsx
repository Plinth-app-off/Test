export default function Sparkline({ data, color = 'var(--accent)', height = 12 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data, 1);
  const w = 70, h = height;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - (v / max) * h]);
  const path = pts.reduce(
    (a, [x, y], i) => a + (i === 0 ? `M${x},${y}` : ` L${x},${y}`),
    ''
  );
  return (
    <svg
      className="spark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
    >
      <path d={path + ` L${w},${h} L0,${h} Z`} fill={color} opacity={0.2} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.2} />
    </svg>
  );
}
