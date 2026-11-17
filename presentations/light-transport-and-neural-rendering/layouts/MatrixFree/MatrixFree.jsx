import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import './MatrixFree.css';

const WIDTH = 1168;
const HEIGHT = 330;
const AXIS_Y = 200;
const MARGIN = 48;
/** Decades of the memory axis, in log10 bytes. */
const DECADES = [2, 13];
const UNITS = { 3: '1 kB', 6: '1 MB', 9: '1 GB', 12: '1 TB' };

function x(bytes) {
  return MARGIN + (WIDTH - 2 * MARGIN) * (Math.log10(bytes) - DECADES[0]) / (DECADES[1] - DECADES[0]);
}

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } };

/**
 * Why a solver applies A instead of storing it: a memory axis (bytes, log
 * scale) with the slide's `marks`, each `{ bytes, label, size, kind, step,
 * lift, align? }` appearing at build step `step`. `kind` (operator, light,
 * reference) sets the color, `lift` the label's height above the axis in
 * stage pixels, and `align` ("left" or "right" of the stem; centered
 * without it) where the label sits. Optional `spans` `{ from, to, label,
 * step }` bracket a range of bytes under the axis, and `equation` `{ text,
 * step }` appears under the figure.
 */
export default function MatrixFree({ slide, buildStep }) {
  const decades = [];
  for (let d = DECADES[0]; d <= DECADES[1]; d += 1) decades.push(d);
  const marks = slide.marks.filter((mark) => mark.step <= buildStep);
  const spans = (slide.spans ?? []).filter((span) => span.step <= buildStep);
  const spanY = AXIS_Y + 56;

  return (
    <div className="slide--matrix-free">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="matrix-free-body">
        <div className="matrix-free-axis" style={{ width: WIDTH, height: HEIGHT }}>
          <svg width={WIDTH} height={HEIGHT}>
            <line x1={MARGIN} x2={WIDTH - MARGIN} y1={AXIS_Y} y2={AXIS_Y} className="matrix-free-axis-line" />
            {decades.map((d) => (
              <g key={d}>
                <line x1={x(10 ** d)} x2={x(10 ** d)} y1={AXIS_Y} y2={AXIS_Y + (UNITS[d] ? 10 : 5)} className="matrix-free-axis-line" />
                {UNITS[d] && <text x={x(10 ** d)} y={AXIS_Y + 34} textAnchor="middle" className="matrix-free-tick">{UNITS[d]}</text>}
              </g>
            ))}
            {marks.map((mark) => (
              <motion.g key={mark.label} {...fade}>
                <line x1={x(mark.bytes)} x2={x(mark.bytes)} y1={AXIS_Y - mark.lift} y2={AXIS_Y} className={`matrix-free-stem matrix-free-stem--${mark.kind}`} />
                <circle cx={x(mark.bytes)} cy={AXIS_Y} r={8} className={`matrix-free-dot matrix-free-dot--${mark.kind}`} />
              </motion.g>
            ))}
            {spans.map((span) => (
              <motion.path
                key={span.label}
                d={`M${x(span.from)},${spanY - 8}V${spanY}H${x(span.to)}V${spanY - 8}`}
                className="matrix-free-span"
                {...fade}
              />
            ))}
          </svg>
          {marks.map((mark) => (
            <motion.div
              key={mark.label}
              className={`matrix-free-mark matrix-free-mark--${mark.kind}${mark.align ? ` matrix-free-mark--${mark.align}` : ''}`}
              style={{ left: x(mark.bytes), bottom: HEIGHT - AXIS_Y + mark.lift + 6 }}
              {...fade}
            >
              <div className="matrix-free-mark-label"><Text>{mark.label}</Text></div>
              <div className="matrix-free-mark-size">{mark.size}</div>
            </motion.div>
          ))}
          {spans.map((span) => (
            <motion.div
              key={span.label}
              className="matrix-free-span-label"
              style={{ left: (x(span.from) + x(span.to)) / 2, top: spanY + 6 }}
              {...fade}
            >
              <Text>{span.label}</Text>
            </motion.div>
          ))}
        </div>
        {slide.equation && slide.equation.step <= buildStep && (
          <motion.div className="matrix-free-equation" {...fade}><Text>{slide.equation.text}</Text></motion.div>
        )}
      </div>
    </div>
  );
}
