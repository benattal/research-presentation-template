/**
 * A plot on white beside a render: thin axes, labelled ticks, and series
 * drawn as lines, dots, bars, or filled areas. Sizes are stage pixels;
 * axis labels and notes may hold math. Colors come from each series'
 * `className` (charts.css or the layout's CSS), never from inline hex.
 */
import Text from '@core/stage/Text.jsx';
import './charts.css';

const MARGIN = { left: 58, right: 14, top: 18, bottom: 64 };
/** Room above the plot area for a y label placed there (`labelAbove`), in stage pixels. */
const LABEL_ROOM = 26;

function scale({ min, max }, from, to) {
  return (value) => from + ((to - from) * (value - min)) / (max - min);
}

function pathOf(points, x, y) {
  return points.map(([u, v], i) => `${i ? 'L' : 'M'}${x(u).toFixed(2)},${y(v).toFixed(2)}`).join('');
}

/**
 * `x` and `y` are axes { min, max, ticks: [{ value, label }], label };
 * the y label sits inside the plot area's top left corner, or above the
 * plot area with `labelAbove: true` on the y axis (for data that reach
 * the top);
 * `series` is a list of { kind: 'line' | 'dots' | 'bars' | 'area',
 * points: [[x, y], …], className, barWidth (x units), radius }; `marks`
 * are vertical lines { x, className }; `notes` are labels { x, y, text,
 * dx, dy, align: 'left' | 'right' | 'center', className } placed at data
 * coordinates. `onPointer(x)` (optional) receives the data x under the
 * pointer while a button is held: the plot becomes a scrubber.
 */
export default function Chart({ width, height, x: xAxis, y: yAxis, series = [], marks = [], notes = [], onPointer, className = '' }) {
  const right = width - MARGIN.right;
  const bottom = height - MARGIN.bottom;
  const top = MARGIN.top + (yAxis.labelAbove ? LABEL_ROOM : 0);
  const x = scale(xAxis, MARGIN.left, right);
  const y = scale(yAxis, bottom, top);
  const clampY = (v) => Math.min(bottom, Math.max(top, y(v)));

  const scrub = onPointer && ((event) => {
    if (event.type === 'pointermove' && event.buttons === 0) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) * width) / rect.width;
    const value = xAxis.min + ((px - MARGIN.left) / (right - MARGIN.left)) * (xAxis.max - xAxis.min);
    onPointer(Math.min(xAxis.max, Math.max(xAxis.min, value)));
  });

  return (
    <div className={`chart ${className}`} style={{ width, height }} data-no-swipe={onPointer ? '' : undefined}>
      <svg
        width={width}
        height={height}
        className={`chart-svg${onPointer ? ' chart-svg--scrub' : ''}`}
        onPointerDown={scrub}
        onPointerMove={scrub}
      >
        {yAxis.ticks.map((tick) => (
          <g key={`y${tick.value}`}>
            <line x1={MARGIN.left - 6} x2={MARGIN.left} y1={y(tick.value)} y2={y(tick.value)} className="chart-axis" />
            <text x={MARGIN.left - 10} y={y(tick.value)} className="chart-tick" textAnchor="end" dominantBaseline="middle">{tick.label}</text>
          </g>
        ))}
        {xAxis.ticks.map((tick) => (
          <g key={`x${tick.value}`}>
            <line x1={x(tick.value)} x2={x(tick.value)} y1={bottom} y2={bottom + 6} className="chart-axis" />
            <text x={x(tick.value)} y={bottom + 24} className="chart-tick" textAnchor="middle">{tick.label}</text>
          </g>
        ))}
        {series.map((s, i) => {
          if (s.kind === 'line') return <path key={i} d={pathOf(s.points, x, clampY)} className={`chart-line ${s.className ?? ''}`} />;
          if (s.kind === 'area') {
            const d = `${pathOf(s.points, x, clampY)}L${x(s.points.at(-1)[0])},${y(Math.max(yAxis.min, 0))}L${x(s.points[0][0])},${y(Math.max(yAxis.min, 0))}Z`;
            return <path key={i} d={d} className={`chart-area ${s.className ?? ''}`} />;
          }
          if (s.kind === 'dots') {
            return (
              <g key={i} className={`chart-dots ${s.className ?? ''}`}>
                {s.points.map(([u, v], k) => <circle key={k} cx={x(u)} cy={clampY(v)} r={s.radius ?? 3} />)}
              </g>
            );
          }
          if (s.kind === 'bars') {
            const half = ((s.barWidth ?? 1) / 2) * ((right - MARGIN.left) / (xAxis.max - xAxis.min));
            return (
              <g key={i} className={`chart-bars ${s.className ?? ''}`}>
                {s.points.map(([u, top, base = 0], k) => (top === base ? null : (
                  <rect key={k} x={x(u) - half} width={2 * half} y={clampY(top)} height={Math.max(0, clampY(base) - clampY(top))} />
                )))}
              </g>
            );
          }
          throw new Error(`Unknown chart series kind "${s.kind}"`);
        })}
        {marks.map((mark, i) => (
          <line key={`m${i}`} x1={x(mark.x)} x2={x(mark.x)} y1={top} y2={bottom} className={`chart-mark ${mark.className ?? ''}`} />
        ))}
        <line x1={MARGIN.left} x2={MARGIN.left} y1={top} y2={bottom} className="chart-axis" />
        <line x1={MARGIN.left} x2={right} y1={bottom} y2={bottom} className="chart-axis" />
      </svg>
      {yAxis.label && (
        <div className="chart-label chart-label--y" style={{ left: yAxis.labelAbove ? MARGIN.left - 10 : MARGIN.left + 8, top: 0 }}>
          <Text>{yAxis.label}</Text>
        </div>
      )}
      {xAxis.label && <div className="chart-label chart-label--x" style={{ left: MARGIN.left, width: right - MARGIN.left, top: bottom + 36 }}><Text>{xAxis.label}</Text></div>}
      {notes.map((note, i) => (
        <div
          key={`n${i}`}
          className={`chart-note chart-note--${note.align ?? 'left'} ${note.className ?? ''}`}
          style={{ left: x(note.x) + (note.dx ?? 0), top: y(note.y) + (note.dy ?? 0) }}
        >
          <Text>{note.text}</Text>
        </div>
      ))}
    </div>
  );
}
