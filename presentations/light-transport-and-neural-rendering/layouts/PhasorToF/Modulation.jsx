import Text from '@core/stage/Text.jsx';
import { amplitudeOf, phaseOf, phasor, sumPhasors } from '../activeSensing/measurement.js';

/** The time the plot spans, in seconds: three round trips to the wall at 2 m. */
const WINDOW = 40e-9;
/** Points per wave drawn across the window. */
const POINTS = 400;
/**
 * Margins of the plot inside the figure, in stage pixels: room for each
 * row's label above it, for τ at the right, and for the delay φ under the
 * received row.
 */
const PLOT = { left: 8, right: 26, top: 28, rowGap: 40, bottom: 46 };

/** The color of a tone: an ink role of the theme, or `text` for the text color (measurements), as PhasorPlane colors its arrows. */
const toneColor = (tone) => (tone === 'text' ? 'var(--text-primary)' : `var(--ink-${tone})`);

/** An SVG path of amplitude · cos(2πfτ − phase) across the window, about the row's center line. */
function wavePath(x, rowCenter, halfHeight, { amplitude, phase }, frequency) {
  const points = [];
  for (let i = 0; i <= POINTS; i += 1) {
    const time = (WINDOW * i) / POINTS;
    const value = amplitude * Math.cos(2 * Math.PI * frequency * time - phase);
    points.push(`${x(time).toFixed(1)},${(rowCenter - value * halfHeight).toFixed(1)}`);
  }
  return `M${points.join('L')}`;
}

/**
 * The modulation of the light against time τ, on white: the source's
 * intensity (emitted) and the light returning to the pixel (received),
 * each drawn about its mean as a sinusoid at the modulation frequency. The
 * received modulation is the sum of the returns, each delayed by its
 * path's travel time. The delay from the emitted crest at τ = 0 to the next
 * received crest, marked under the received row, is the phase φ of the
 * phasor plane as a time: the same φ, and it wraps as the phase does.
 *
 * `frequency` in hertz; `returns` are `{ amplitude, phase, tone }` (phase
 * in radians, tone an ink role of the theme); with several returns their
 * sum is drawn over them in the text color. `scale` is the amplitude drawn
 * at a row's half height. Sizes are stage pixels.
 */
export default function Modulation({ width, height, frequency, returns, scale }) {
  const rowHeight = (height - PLOT.top - PLOT.rowGap - PLOT.bottom) / 2;
  const halfHeight = rowHeight / 2;
  const plotWidth = width - PLOT.left - PLOT.right;
  const x = (time) => PLOT.left + (plotWidth * time) / WINDOW;
  const emittedCenter = PLOT.top + halfHeight;
  const receivedTop = PLOT.top + rowHeight + PLOT.rowGap;
  const receivedCenter = receivedTop + halfHeight;
  const sum = sumPhasors(returns.map((r) => phasor(r.amplitude, r.phase)));
  const measured = { amplitude: amplitudeOf(sum) / scale, phase: phaseOf(sum) };
  // The received crest after τ = 0: the measured phase, as a delay.
  const crest = measured.phase / (2 * Math.PI * frequency);
  const shown = crest < WINDOW;
  const several = returns.length > 1;
  const bracketY = receivedTop + rowHeight + 14;

  return (
    <div className="phasor-tof-modulation" style={{ width, height }}>
      <svg width={width} height={height} aria-hidden="true">
        {[emittedCenter, receivedCenter].map((center) => (
          <line key={center} className="phasor-tof-modulation-mean" x1={PLOT.left} y1={center} x2={width - PLOT.right} y2={center} />
        ))}
        {/* The emitted crest at τ = 0, down through both rows, and the received crest after it. */}
        <line className="phasor-tof-modulation-crest" x1={x(0)} y1={emittedCenter - halfHeight} x2={x(0)} y2={bracketY} />
        {shown && <line className="phasor-tof-modulation-crest" x1={x(crest)} y1={receivedTop} x2={x(crest)} y2={bracketY} />}
        <path
          className="phasor-tof-modulation-wave"
          d={wavePath(x, emittedCenter, halfHeight * 0.85, { amplitude: 1, phase: 0 }, frequency)}
          style={{ stroke: toneColor('light-0') }}
        />
        {returns.map((r) => (
          <path
            key={r.tone}
            className="phasor-tof-modulation-wave"
            d={wavePath(x, receivedCenter, halfHeight, { amplitude: r.amplitude / scale, phase: r.phase }, frequency)}
            style={{ stroke: toneColor(r.tone), strokeWidth: several ? 1.5 : 2.5 }}
          />
        ))}
        {several && (
          <path className="phasor-tof-modulation-wave" d={wavePath(x, receivedCenter, halfHeight, measured, frequency)} style={{ stroke: toneColor('text') }} />
        )}
        {shown && (
          <path
            className="phasor-tof-modulation-bracket"
            d={`M${x(0)},${bracketY}L${x(crest)},${bracketY}M${x(crest) - 7},${bracketY - 4}L${x(crest)},${bracketY}L${x(crest) - 7},${bracketY + 4}`}
          />
        )}
      </svg>
      <span className="phasor-tof-modulation-label" style={{ left: PLOT.left + 8, top: PLOT.top - 24 }}>emitted</span>
      <span className="phasor-tof-modulation-label" style={{ left: PLOT.left + 8, top: receivedTop - 24 }}>received</span>
      {shown && (
        <span className="phasor-tof-modulation-phi" style={{ left: (x(0) + x(crest)) / 2, top: bracketY + 4 }}><Text>{'$\\phi$'}</Text></span>
      )}
      <span className="phasor-tof-modulation-time" style={{ left: width - PLOT.right + 6, top: receivedCenter }}><Text>{'$\\tau$'}</Text></span>
    </div>
  );
}
