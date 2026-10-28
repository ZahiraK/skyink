import { COLORS } from '../lib/colors'

// Mouse controls for now. Gesture-driven palette selection is on the roadmap.
export default function Toolbar({ color, onColor, onClear, onSave, cameraOn, onToggleCamera }) {
  return (
    <div className="toolbar">
      <div className="swatches" role="radiogroup" aria-label="Ink color">
        {COLORS.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={c === color}
            aria-label={`Ink color ${c}`}
            className={c === color ? 'swatch active' : 'swatch'}
            style={{ background: c }}
            onClick={() => onColor(c)}
          />
        ))}
      </div>
      <div className="actions">
        <button onClick={onClear}>Clear</button>
        <button onClick={onSave}>Save PNG</button>
        <button className="primary" onClick={onToggleCamera}>
          {cameraOn ? 'Stop camera' : 'Start camera'}
        </button>
      </div>
    </div>
  )
}
