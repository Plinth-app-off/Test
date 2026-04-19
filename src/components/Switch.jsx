export default function Switch({ on, onChange }) {
  return (
    <div className={'switch' + (on ? ' on' : '')} onClick={onChange}>
      <div className="knob" />
    </div>
  );
}
