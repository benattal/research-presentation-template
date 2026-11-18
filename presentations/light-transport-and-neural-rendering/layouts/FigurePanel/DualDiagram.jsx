import Text from '@core/stage/Text.jsx';

/** One configuration's drawing area, in stage pixels; the dual sits under the primal. */
const PANEL = [580, 236];
const GAP = 34;
/** Device centers, the image-plane grids (6 × 6 cells), and the scene, in panel pixels. */
const LEFT = [58, 92];
const RIGHT = [522, 92];
const CELL = 10;
const CELLS = 6;
const LEFT_GRID = [120, 62];
const RIGHT_GRID = [400, 62];
const SCENE = { center: [290, 172], radius: 40 };
/** The highlighted pixels, [column, row] in their grids: projector pixel k, camera pixel j. */
const PIXEL_K = [4, 2];
const PIXEL_J = [1, 3];

const cellCenter = (grid, [column, row]) => [grid[0] + (column + 0.5) * CELL, grid[1] + (row + 0.5) * CELL];
const K = cellCenter(LEFT_GRID, PIXEL_K);
const J = cellCenter(RIGHT_GRID, PIXEL_J);
/** The scene point the path reflects from: on the object's upper left. */
const POINT = [SCENE.center[0] - SCENE.radius * 0.72, SCENE.center[1] - SCENE.radius * 0.69];

/** The two configurations: which device is where, the path's direction, and the labels. */
const CONFIGURATIONS = [
  {
    name: 'primal',
    left: { device: 'projector', label: 'projector $p$' },
    right: { device: 'camera', label: 'camera $\\mathbf{T}p$' },
    path: [K, POINT, J],
    entry: '$\\mathbf{T}_{jk}$',
  },
  {
    name: 'dual',
    left: { device: 'camera', label: 'virtual camera $\\mathbf{T}^\\top c$' },
    right: { device: 'projector', label: 'virtual projector $c$' },
    path: [J, POINT, K],
    entry: '$(\\mathbf{T}^\\top)_{kj} = \\mathbf{T}_{jk}$',
  },
];

/** How far a device's lens is from its center, toward the scene. */
const LENS = 30;

/** A projector (a body with a round lens) or a camera (a body with a lens hood), its lens toward `facing` (+1 right, −1 left). */
function Device({ kind, center: [x, y], facing }) {
  const back = x - facing * 24;
  const front = x + facing * 14;
  const body = <rect x={Math.min(back, front)} y={y - 16} width={38} height={32} rx={4} />;
  if (kind === 'projector') {
    return <g className="dual-device">{body}<circle cx={x + facing * 21} cy={y} r={10} /></g>;
  }
  const tip = x + facing * LENS;
  return (
    <g className="dual-device">
      {body}
      <path d={`M ${front} ${y - 7} L ${tip} ${y - 14} L ${tip} ${y + 14} L ${front} ${y + 7} Z`} />
    </g>
  );
}

/** A pixel grid of CELLS × CELLS cells at `origin`, with the cell `marked` filled in `markClass`. */
function Grid({ origin: [x0, y0], marked, markClass }) {
  const size = CELL * CELLS;
  const lines = [];
  for (let i = 0; i <= CELLS; i += 1) {
    lines.push(<line key={`v${i}`} x1={x0 + i * CELL} y1={y0} x2={x0 + i * CELL} y2={y0 + size} />);
    lines.push(<line key={`h${i}`} x1={x0} y1={y0 + i * CELL} x2={x0 + size} y2={y0 + i * CELL} />);
  }
  return (
    <g className="dual-grid">
      <rect x={x0} y={y0} width={size} height={size} className="dual-grid-back" />
      <rect x={x0 + marked[0] * CELL} y={y0 + marked[1] * CELL} width={CELL} height={CELL} className={markClass} />
      {lines}
    </g>
  );
}

/** The lines from a device's lens to the corners of its grid. */
function Frustum({ lens, grid }) {
  const size = CELL * CELLS;
  const near = lens[0] < grid[0] ? grid[0] : grid[0] + size;
  return (
    <g className="dual-frustum">
      <line x1={lens[0]} y1={lens[1]} x2={near} y2={grid[1]} />
      <line x1={lens[0]} y1={lens[1]} x2={near} y2={grid[1] + size} />
    </g>
  );
}

/** A path of light through `points`, with an arrowhead at the middle of each segment. */
function LightPath({ points }) {
  const arrows = points.slice(1).map((b, i) => {
    const a = points[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [ux, uy] = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    const [mx, my] = [(a[0] + b[0]) / 2 + 5 * ux, (a[1] + b[1]) / 2 + 5 * uy];
    return `M ${mx} ${my} L ${mx - 11 * ux + 5 * uy} ${my - 11 * uy - 5 * ux} L ${mx - 11 * ux - 5 * uy} ${my - 11 * uy + 5 * ux} Z`;
  });
  return (
    <g className="dual-path">
      <polyline points={points.map((p) => p.join(',')).join(' ')} />
      {arrows.map((d) => <path key={d} d={d} />)}
    </g>
  );
}

/**
 * Dual photography's two configurations, drawn after Sen et al. 2005,
 * Fig. 2, in the lecture's notation: in the primal one a projector shows
 * pattern p and the camera's image is Tp; in the dual one a virtual
 * projector at the camera shows pattern c and a virtual camera at the
 * projector records Tᵀc. One light path joins projector pixel k (gold, as
 * a light element) and camera pixel j (cyan, as the pixel of a row), with
 * throughput T_jk in both directions. Stage pixels; the labels are slide
 * text over the drawing.
 */
export default function DualDiagram({ width }) {
  if (width !== PANEL[0]) throw new Error(`DualDiagram: drawn ${PANEL[0]} stage pixels wide, not ${width}`);
  const height = 2 * PANEL[1] + GAP;
  const lensLeft = [LEFT[0] + LENS, LEFT[1]];
  const lensRight = [RIGHT[0] - LENS, RIGHT[1]];
  return (
    <div className="dual-diagram" style={{ width: PANEL[0], height }}>
      <svg width={PANEL[0]} height={height} viewBox={`0 0 ${PANEL[0]} ${height}`}>
        {CONFIGURATIONS.map((configuration, i) => (
          <g key={configuration.name} transform={`translate(0, ${i * (PANEL[1] + GAP)})`}>
            <Frustum lens={lensLeft} grid={LEFT_GRID} />
            <Frustum lens={lensRight} grid={RIGHT_GRID} />
            <Device kind={configuration.left.device} center={LEFT} facing={1} />
            <Device kind={configuration.right.device} center={RIGHT} facing={-1} />
            <circle cx={SCENE.center[0]} cy={SCENE.center[1]} r={SCENE.radius} className="dual-scene" />
            <Grid origin={LEFT_GRID} marked={PIXEL_K} markClass="dual-pixel-k" />
            <Grid origin={RIGHT_GRID} marked={PIXEL_J} markClass="dual-pixel-j" />
            <LightPath points={configuration.path} />
          </g>
        ))}
        <line x1={0} y1={PANEL[1] + GAP / 2} x2={PANEL[0]} y2={PANEL[1] + GAP / 2} className="dual-rule" />
      </svg>
      {CONFIGURATIONS.map((configuration, i) => {
        const top = i * (PANEL[1] + GAP);
        const at = ([x, y]) => ({ left: x, top: top + y });
        // Labels are centered on their anchor; the devices' labels start at the left edge or end at the right one.
        return [
          <span key={`${configuration.name}-name`} className="dual-label dual-label--name" style={at([PANEL[0] / 2, 14])}>{configuration.name}</span>,
          <span key={`${configuration.name}-left`} className="dual-label dual-label--start" style={at([0, LEFT[1] + 46])}><Text>{configuration.left.label}</Text></span>,
          <span key={`${configuration.name}-right`} className="dual-label dual-label--end" style={at([PANEL[0], RIGHT[1] + 46])}><Text>{configuration.right.label}</Text></span>,
          <span key={`${configuration.name}-k`} className="dual-label" style={at([LEFT_GRID[0] + 30, LEFT_GRID[1] - 16])}><Text>{'pixel $k$'}</Text></span>,
          <span key={`${configuration.name}-j`} className="dual-label" style={at([RIGHT_GRID[0] + 30, RIGHT_GRID[1] - 16])}><Text>{'pixel $j$'}</Text></span>,
          <span key={`${configuration.name}-entry`} className="dual-label" style={at([SCENE.center[0] + 2, SCENE.center[1] - SCENE.radius - 44])}><Text>{configuration.entry}</Text></span>,
          <span key={`${configuration.name}-scene`} className="dual-label dual-label--muted" style={at([SCENE.center[0], SCENE.center[1] + SCENE.radius + 16])}>scene</span>,
        ];
      })}
    </div>
  );
}
