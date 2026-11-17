/**
 * The partial sums of 1 + a + a² + … (a = 0.8) rising to 1/(1 − a): the
 * picture of the Neumann series section, for its divider.
 */
export default function SeriesPlot({ width, height }) {
  const a = 0.8;
  const limit = 1 / (1 - a);
  const terms = 18;
  const left = 24;
  const right = width - 24;
  const top = 40;
  const bottom = height - 30;
  let sum = 0;
  const points = Array.from({ length: terms }, (_, k) => {
    sum += a ** k;
    return [left + (k * (right - left)) / (terms - 1), bottom - ((bottom - top) * sum) / limit];
  });
  return (
    <svg className="series-plot" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <line x1={left} x2={right} y1={top} y2={top} className="series-plot-limit" />
      <line x1={left} x2={right} y1={bottom} y2={bottom} className="series-plot-axis" />
      {points.map(([x, y], k) => (
        <line key={`bar-${k}`} x1={x} x2={x} y1={k === 0 ? bottom : points[k - 1][1]} y2={y} className="series-plot-term" />
      ))}
      {points.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="5" className="series-plot-dot" />)}
    </svg>
  );
}
