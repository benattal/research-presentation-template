import Text from '@core/stage/Text.jsx';
import './activeSensing.css';

/** The color of a tone: an ink role of the theme, or `text` for the text color (measurements). */
const toneColor = (tone) => (tone === 'text' ? 'var(--text-primary)' : `var(--ink-${tone})`);

/** Pixels between the plot's edge and the dashed reference circle. */
const MARGIN = 34;

/** Distance from an arrow to the nearest edge of its label, in stage pixels. */
const LABEL_GAP = 9;

/**
 * The complex plane on white: thin axes through the center, a dashed circle
 * of value `radius`, and phasor arrows.
 *
 * - `arrows`: `{ from, to, tone, width?, opacity?, label?, labelAt? }` with
 *   `from`/`to` as [re, im] in data units, `tone` an ink role of the theme
 *   (`light-1`, `light-2`, `medium`, `learned`, `adjoint`) or `text` for a
 *   measurement in the text color, and an optional
 *   short math label placed past the tip (`labelAt: 'tip'`, the default) or
 *   beside the middle (`'left'` or `'right'` of the arrow's direction).
 * - `rays`: `{ angle, tone }` dashed lines from the origin to the circle.
 * - `arc`: `{ angle, tone, label }` the angle swept from the real axis, with
 *   a math label at its middle.
 *
 * Sizes are stage pixels.
 */
export default function PhasorPlane({ width, height, radius, arrows, rays = [], arc = null }) {
  const cx = width / 2;
  const cy = height / 2;
  const pixels = Math.min(width, height) / 2 - MARGIN;
  const scale = pixels / radius;
  const toPlot = ([re, im]) => [cx + re * scale, cy - im * scale];
  const arcRadius = Math.min(52, pixels * 0.3);
  const arcSweep = arc ? ((arc.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) : 0;
  const plotted = arrows.map((arrow) => ({ ...arrow, start: toPlot(arrow.from), end: toPlot(arrow.to) }));

  return (
    <div className="active-sensing-plane" style={{ width, height }}>
      <svg width={width} height={height} aria-hidden="true">
        <line className="active-sensing-axis" x1={6} y1={cy} x2={width - 6} y2={cy} />
        <line className="active-sensing-axis" x1={cx} y1={6} x2={cx} y2={height - 6} />
        <circle className="active-sensing-circle" cx={cx} cy={cy} r={pixels} />
        {rays.map(({ angle, tone }, i) => (
          <line
            key={`ray-${i}`}
            className="active-sensing-guide"
            style={{ stroke: toneColor(tone) }}
            x1={cx}
            y1={cy}
            x2={cx + pixels * Math.cos(angle)}
            y2={cy - pixels * Math.sin(angle)}
          />
        ))}
        {arc && <AngleArc cx={cx} cy={cy} radius={arcRadius} sweep={arcSweep} tone={arc.tone} />}
        {plotted.map(({ start, end, tone, width: stroke, opacity }, i) => (
          <Arrow key={i} start={start} end={end} tone={tone} stroke={stroke} opacity={opacity} />
        ))}
        <text className="active-sensing-axis-label" x={width - 4} y={cy - 10} textAnchor="end">Re</text>
        <text className="active-sensing-axis-label" x={cx + 10} y={18}>Im</text>
      </svg>
      {arc && arcSweep >= 0.02 && (
        <span
          className="active-sensing-plane-label"
          style={{
            left: cx + (arcRadius + 16) * Math.cos(arcSweep / 2),
            top: cy - (arcRadius + 16) * Math.sin(arcSweep / 2),
            color: toneColor(arc.tone),
          }}
        >
          <Text>{arc.label}</Text>
        </span>
      )}
      {plotted.filter((arrow) => arrow.label).map((arrow) => (
        <span
          key={arrow.label}
          className="active-sensing-plane-label"
          style={{ ...labelPosition(arrow), color: toneColor(arrow.tone), opacity: arrow.opacity ?? 1 }}
        >
          <Text>{arrow.label}</Text>
        </span>
      ))}
    </div>
  );
}

/**
 * Where an arrow's label goes, in plot pixels: past its tip, or beside its
 * middle. The anchor is LABEL_GAP from the arrow, and the label's box
 * extends away from the arrow (to the right of an anchor on the arrow's
 * right, below one under it), so a label of any length keeps clear of it.
 */
function labelPosition({ start, end, labelAt = 'tip' }) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / length, dy / length];
  // Screen y points down, so (uy, −ux) is the left of the arrow's direction.
  const side = labelAt === 'left' ? 1 : -1;
  const [anchor, [nx, ny]] = labelAt === 'tip'
    ? [end, [ux, uy]]
    : [[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], [side * uy, -side * ux]];
  return {
    left: anchor[0] + nx * LABEL_GAP,
    top: anchor[1] + ny * LABEL_GAP,
    transform: `translate(${-50 + 50 * nx}%, ${-50 + 50 * ny}%)`,
  };
}

/** One phasor as an arrow; the head shrinks for short arrows so it never overshoots the tail. */
function Arrow({ start, end, tone, stroke = 2.5, opacity = 1 }) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  if (length < 0.5) return null;
  const head = Math.min(7 + 2.2 * stroke, length * 0.5);
  const ux = dx / length;
  const uy = dy / length;
  const base = [end[0] - ux * head, end[1] - uy * head];
  const side = head * 0.45;
  const points = [end, [base[0] - uy * side, base[1] + ux * side], [base[0] + uy * side, base[1] - ux * side]];
  const color = toneColor(tone);
  return (
    <g opacity={opacity}>
      <line x1={start[0]} y1={start[1]} x2={base[0] + ux} y2={base[1] + uy} style={{ stroke: color }} strokeWidth={stroke} strokeLinecap="round" />
      <polygon points={points.map((p) => p.join(',')).join(' ')} style={{ fill: color }} />
    </g>
  );
}

/** The arc from the positive real axis through `sweep` radians counterclockwise, in [0, 2π). */
function AngleArc({ cx, cy, radius, sweep, tone }) {
  if (sweep < 0.02) return null;
  const end = [cx + radius * Math.cos(sweep), cy - radius * Math.sin(sweep)];
  const largeArc = sweep > Math.PI ? 1 : 0;
  return (
    <path
      className="active-sensing-arc"
      style={{ stroke: toneColor(tone) }}
      d={`M ${cx + radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 0 ${end[0]} ${end[1]}`}
    />
  );
}
