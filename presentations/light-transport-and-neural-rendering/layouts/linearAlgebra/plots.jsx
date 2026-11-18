/**
 * Plots on white for the linear algebra slides: bars per vector entry
 * (`Bars`) and a plot with linear or logarithmic axes (`Plot`). Sizes are
 * stage pixels; labels may hold math.
 */
import { useId } from 'react';
import Text from '@core/stage/Text.jsx';
import './linearAlgebra.css';

/** Number of bounce-order ink colors (`--ink-light-0` … `--ink-light-4`). */
export const INKS = 5;

/** Round `value` up to 1, 2, 2.5, or 5 times a power of ten. */
export function niceCeiling(value) {
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((v) => v >= value * 0.999);
}

/** Ticks at every power of ten from 10^lo to 10^hi, labelled plainly. */
export function decadeTicks(lo, hi) {
  const ticks = [];
  for (let d = lo; d <= hi; d += 1) ticks.push({ value: 10 ** d, label: d < 0 ? (10 ** d).toFixed(-d) : (10 ** d).toLocaleString('en-US') });
  return ticks;
}

/**
 * Bars per vector entry. `stacks[i][k]` is entry i's part k, stacked in
 * the ink colors of bounce order k; `exact[i]` (optional) is drawn as a
 * dark tick across the bar; `errors[i]` (optional) as a whisker of ± that
 * much around the stack's top. `top` is the value at the plot's top and
 * `label` the axis label; `names` (optional) labels the bars, an empty
 * name leaving a bar unlabelled; without it bars are numbered from 1.
 * `xLabel` (optional) names the bars' axis, under the names.
 */
export function Bars({ width, height, stacks, exact, errors, top, label, names, xLabel }) {
  const margin = { left: 64, right: 8, top: 30, bottom: xLabel ? 48 : 34 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const slot = plotWidth / stacks.length;
  const barWidth = Math.min(54, slot * 0.58);
  const y = (value) => margin.top + plotHeight * (1 - Math.min(value, top) / top);
  const format = (value) => String(Number(value.toFixed(2)));

  return (
    <div className="la-plot" style={{ width, height }}>
      <svg width={width} height={height} className="la-plot-svg">
        {[0, top / 2, top].map((tick) => (
          <g key={tick}>
            <line x1={margin.left - 6} x2={margin.left} y1={y(tick)} y2={y(tick)} className="la-plot-axis" />
            <text x={margin.left - 10} y={y(tick)} className="la-plot-tick" textAnchor="end" dominantBaseline="middle">{format(tick)}</text>
          </g>
        ))}
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotHeight} className="la-plot-axis" />
        <line x1={margin.left} x2={width - margin.right} y1={y(0)} y2={y(0)} className="la-plot-axis" />
        {stacks.map((stack, i) => {
          const center = margin.left + slot * (i + 0.5);
          let base = 0;
          const total = stack.reduce((sum, v) => sum + v, 0);
          const low = errors ? Math.max(0, total - errors[i]) : 0;
          const high = errors ? total + errors[i] : 0;
          return (
            <g key={i}>
              {stack.map((value, k) => {
                if (value <= 0) return null;
                const y0 = y(base);
                base += value;
                const y1 = y(base);
                return (
                  <rect
                    key={k}
                    x={center - barWidth / 2}
                    y={y1}
                    width={barWidth}
                    height={Math.max(0, y0 - y1)}
                    className="la-plot-segment"
                    style={{ fill: `var(--ink-light-${Math.min(k, INKS - 1)})` }}
                  />
                );
              })}
              {exact && <line x1={center - barWidth / 2 - 7} x2={center + barWidth / 2 + 7} y1={y(exact[i])} y2={y(exact[i])} className="la-plot-exact" />}
              {errors && Number.isFinite(errors[i]) && errors[i] > 0 && (
                <g className="la-plot-whisker">
                  <line x1={center} x2={center} y1={y(low)} y2={y(high)} />
                  <line x1={center - 6} x2={center + 6} y1={y(low)} y2={y(low)} />
                  <line x1={center - 6} x2={center + 6} y1={y(high)} y2={y(high)} />
                </g>
              )}
              <text x={center} y={height - margin.bottom + 24} className="la-plot-tick" textAnchor="middle">{names ? names[i] : i + 1}</text>
            </g>
          );
        })}
      </svg>
      {label && <div className="la-plot-label" style={{ left: margin.left - 4, top: 0 }}><Text>{label}</Text></div>}
      {xLabel && <div className="la-plot-label la-plot-label--x" style={{ left: margin.left, right: margin.right, bottom: 0 }}><Text>{xLabel}</Text></div>}
    </div>
  );
}

/**
 * The parts of a polyline (stage pixels) between the heights `top` and
 * `bottom`, as SVG path data: a segment that leaves the band ends where it
 * crosses the band's edge, and the line resumes where it comes back.
 */
function bandPath(points, top, bottom) {
  const at = ([qx, qy], [px, py], t) => [qx + (px - qx) * t, qy + (py - qy) * t];
  const move = ([px, py]) => `M${px.toFixed(1)},${py.toFixed(1)}`;
  const line = ([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`;
  let d = '';
  let drawing = false;
  points.forEach((p, k) => {
    if (k === 0) {
      drawing = p[1] >= top && p[1] <= bottom;
      if (drawing) d += move(p);
      return;
    }
    const q = points[k - 1];
    const dy = p[1] - q[1];
    let enter = 0;
    let exit = 1;
    if (dy === 0) {
      if (q[1] < top || q[1] > bottom) enter = 2;
    } else {
      const a = (top - q[1]) / dy;
      const b = (bottom - q[1]) / dy;
      enter = Math.max(0, Math.min(a, b));
      exit = Math.min(1, Math.max(a, b));
    }
    if (enter > exit) {
      drawing = false;
      return;
    }
    if (!drawing || enter > 0) d += move(at(q, p, enter));
    d += line(at(q, p, exit));
    drawing = exit === 1;
  });
  return d;
}

function axisScale({ min, max, log }, from, to) {
  if (log) {
    const a = Math.log10(min);
    const b = Math.log10(max);
    return (value) => from + (to - from) * (Math.log10(value) - a) / (b - a);
  }
  return (value) => from + (to - from) * (value - min) / (max - min);
}

/**
 * A triangle of size `r` (stage pixels) on the plot edge at height `edge`
 * and `cx` across, pointing up out of the plot (`up`) or down out of it:
 * a dot whose value lies past that edge.
 */
function EdgeMark({ cx, edge, up, r }) {
  const out = up ? -1 : 1;
  const tip = edge + out * 1.5 * r;
  const base = edge - out * 0.5 * r;
  return <polygon points={`${cx},${tip} ${cx - 1.1 * r},${base} ${cx + 1.1 * r},${base}`} />;
}

/**
 * A plot with thin axes. `x` and `y` are axes `{ min, max, log?, ticks:
 * [{ value, label }], label? }`. `series` are `{ points: [[x, y]], kind:
 * 'line' | 'dots' | 'stems', className, dashed?, radius?, edges? }`,
 * clipped to the axes; stems are vertical segments `[x, y0, y1]`. A dots
 * series with `edges: true` draws a dot above or below the y range as a
 * triangle on that edge, pointing out of the plot, so a sequence that
 * leaves the plot does not seem to stop. `notes` are labels at data
 * coordinates: `{ x, y, text, className?, dx?, dy?, align? }`.
 */
export function Plot({ width, height, x, y, series, notes = [] }) {
  const margin = { left: 64, right: 16, top: 30, bottom: 48 };
  const sx = axisScale(x, margin.left, width - margin.right);
  const sy = axisScale(y, height - margin.bottom, margin.top);
  // Lines and stems are cut at the clip band, so nothing is drawn far outside the axes.
  const band = [margin.top - 8, height - margin.bottom + 8];
  const clampY = (py) => Math.max(band[0], Math.min(band[1], py));
  const inside = (px, py) => px >= x.min && px <= x.max && py >= y.min && py <= y.max;
  const clipId = `la-plot-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const valid = (px, py) => Number.isFinite(px) && Number.isFinite(py) && (!y.log || py > 0);

  return (
    <div className="la-plot" style={{ width, height }}>
      <svg width={width} height={height} className="la-plot-svg">
        <defs>
          <clipPath id={clipId}>
            <rect x={margin.left - 8} y={margin.top - 8} width={width - margin.left - margin.right + 16} height={height - margin.top - margin.bottom + 16} />
          </clipPath>
        </defs>
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} className="la-plot-axis" />
        <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} className="la-plot-axis" />
        {y.ticks.map((tick) => (
          <g key={`y${tick.value}`}>
            <line x1={margin.left - 6} x2={margin.left} y1={sy(tick.value)} y2={sy(tick.value)} className="la-plot-axis" />
            <text x={margin.left - 10} y={sy(tick.value)} className="la-plot-tick" textAnchor="end" dominantBaseline="middle">{tick.label}</text>
          </g>
        ))}
        {x.ticks.map((tick) => (
          <g key={`x${tick.value}`}>
            <line x1={sx(tick.value)} x2={sx(tick.value)} y1={height - margin.bottom} y2={height - margin.bottom + 6} className="la-plot-axis" />
            <text x={sx(tick.value)} y={height - margin.bottom + 24} className="la-plot-tick" textAnchor="middle">{tick.label}</text>
          </g>
        ))}
        <g clipPath={`url(#${clipId})`}>
          {series.map((s, index) => {
            if (s.kind === 'stems') {
              return (
                <g key={index} className={s.className}>
                  {s.points.filter(([px, a, b]) => valid(px, a) && valid(px, b)).map(([px, a, b], k) => (
                    <line key={k} x1={sx(px)} x2={sx(px)} y1={clampY(sy(a))} y2={clampY(sy(b))} style={s.style?.(px)} />
                  ))}
                </g>
              );
            }
            const points = s.points.filter(([px, py]) => valid(px, py));
            if (s.kind === 'dots') {
              const r = s.radius ?? 4.5;
              const past = ([px, py]) => px >= x.min && px <= x.max && (py > y.max || py < y.min);
              return (
                <g key={index} className={s.className}>
                  {points.filter(([px, py]) => inside(px, py)).map(([px, py], k) => <circle key={k} cx={sx(px)} cy={sy(py)} r={r} />)}
                  {s.edges && points.filter(past).map(([px, py], k) => (
                    <EdgeMark key={`edge${k}`} cx={sx(px)} edge={sy(py > y.max ? y.max : y.min)} up={py > y.max} r={r} />
                  ))}
                </g>
              );
            }
            const path = bandPath(points.map(([px, py]) => [sx(px), sy(py)]), ...band);
            return <path key={index} d={path} className={`la-plot-line ${s.className ?? ''}`} strokeDasharray={s.dashed ? '7 6' : undefined} />;
          })}
        </g>
      </svg>
      {x.label && <div className="la-plot-label la-plot-label--x" style={{ left: margin.left, right: margin.right, bottom: 0 }}><Text>{x.label}</Text></div>}
      {y.label && <div className="la-plot-label" style={{ left: margin.left - 4, top: 0 }}><Text>{y.label}</Text></div>}
      {notes.filter((note) => inside(note.x, note.y)).map((note, index) => (
        <div
          key={`${index}-${note.text}`}
          className={`la-plot-note ${note.className ?? ''}`}
          style={{
            left: sx(note.x) + (note.dx ?? 0),
            top: sy(note.y) + (note.dy ?? 0),
            transform: `translate(${note.align === 'right' ? '-100%' : note.align === 'center' ? '-50%' : '0'}, -50%)`,
          }}
        >
          <Text>{note.text}</Text>
        </div>
      ))}
    </div>
  );
}
