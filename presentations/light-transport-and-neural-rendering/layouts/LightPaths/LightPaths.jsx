import { useRef } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useAnimation, useStageCanvas } from '../canvas/canvas.js';
import EquationStack from '../equations/EquationStack.jsx';
import { rgba, themeColors } from '../volume/draw.js';
import './LightPaths.css';

/** The scene's drawing area, in panel pixels (the coordinates below). */
const PANEL = [940, 520];
/**
 * The part of the panel shown (the scene without its empty margins), in
 * panel pixels, and its size on the stage: `scale` stage pixels per panel
 * pixel, leaving room beside it for the equations.
 */
const VIEW = { left: 40, width: 830, scale: 0.9 };
const VIEW_SIZE = [VIEW.width * VIEW.scale, PANEL[1] * VIEW.scale];

/** Stage position, within the shown panel, of panel point [x, y]. */
function onStage([x, y]) {
  return { left: (x - VIEW.left) * VIEW.scale, top: y * VIEW.scale };
}

/** The scene, a side view in panel pixels: floor (a translucent slab), a wall, a cloud of medium. */
const FLOOR = { y: 400, x0: 30, x1: 840, depth: 52 };
const WALL = { x: FLOOR.x1, y0: 30, y1: FLOOR.y };
const CLOUD = { x: 548, y: 122, rx: 104, ry: 48 };
const PROJECTOR = [150, 82];
const CAMERA = [92, 262];
/** The scene point every path ends at before it reaches the camera. */
const POINT = [500, FLOOR.y];

/**
 * The four kinds of path from the projector to the camera through POINT,
 * after Nayar et al. 2006, Fig. 2: each a polyline from the projector, the
 * color it is drawn in (a theme property), and where its label sits.
 */
const PATHS = {
  direct: {
    points: [PROJECTOR, POINT, CAMERA],
    color: 'light-1',
    label: [214, 218],
  },
  interreflection: {
    points: [PROJECTOR, [WALL.x, 262], POINT, CAMERA],
    color: 'light-2',
    label: [600, 368],
  },
  subsurface: {
    points: [
      PROJECTOR, [604, FLOOR.y], [611, 416], [597, 430], [606, 443], [585, 447], [571, 433],
      [553, 445], [538, 429], [524, 440], [512, 421], POINT, CAMERA,
    ],
    color: 'light-3',
    label: [500, 470],
  },
  volumetric: {
    points: [PROJECTOR, [548, 124], POINT, CAMERA],
    color: 'medium',
    label: [668, 106],
  },
};

const COLORS = ['render-bg', 'light-0', 'light-1', 'light-2', 'light-3', 'medium', 'text-muted'];

function length(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return total;
}

/** The polyline cut at `fraction` of its length. */
function cut(points, fraction) {
  let remaining = fraction * length(points);
  const out = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const segment = Math.hypot(bx - ax, by - ay);
    if (remaining >= segment) {
      out.push(points[i]);
      remaining -= segment;
    } else {
      const t = remaining / segment;
      out.push([ax + t * (bx - ax), ay + t * (by - ay)]);
      break;
    }
  }
  return out;
}

function strokePolyline(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.stroke();
}

/** A small arrowhead at the middle of each full segment of a path, pointing along the light. */
function drawArrows(ctx, points, color, drawn) {
  ctx.fillStyle = color;
  for (let i = 1; i < drawn.length; i += 1) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const segment = Math.hypot(bx - ax, by - ay);
    if (segment < 60 || drawn[i][0] !== bx || drawn[i][1] !== by) continue;
    const ux = (bx - ax) / segment;
    const uy = (by - ay) / segment;
    const mx = (ax + bx) / 2 + 6 * ux;
    const my = (ay + by) / 2 + 6 * uy;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx - 12 * ux + 5 * uy, my - 12 * uy - 5 * ux);
    ctx.lineTo(mx - 12 * ux - 5 * uy, my - 12 * uy + 5 * ux);
    ctx.closePath();
    ctx.fill();
  }
}

/** A path of light: a glowing line, brighter at its core, adding to what is drawn. */
function drawPath(ctx, colors, path, fraction) {
  const drawn = cut(path.points, fraction);
  const color = colors[path.color];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(color, 0.35);
  ctx.lineWidth = 7;
  ctx.shadowColor = rgba(color, 0.9);
  ctx.shadowBlur = 14;
  strokePolyline(ctx, drawn);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(color, 0.95);
  ctx.lineWidth = 2.2;
  strokePolyline(ctx, drawn);
  drawArrows(ctx, path.points, rgba(color, 0.95), drawn);
  ctx.restore();
}

/** A device glyph (camera or projector) at `position`, aimed at `target`. */
function drawDevice(ctx, position, target, color) {
  const angle = Math.atan2(target[1] - position[1], target[0] - position[0]);
  ctx.save();
  ctx.translate(position[0], position[1]);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.fillRect(-26, -14, 28, 28);
  ctx.beginPath();
  ctx.moveTo(2, -8);
  ctx.lineTo(16, -14);
  ctx.lineTo(16, 14);
  ctx.lineTo(2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The scene without light: the floor slab, the wall, the medium, the projector, and the camera. */
function drawScene(ctx, colors, subsurfaceLit) {
  ctx.fillStyle = rgba(colors['render-bg']);
  ctx.fillRect(0, 0, PANEL[0], PANEL[1]);

  const cloud = ctx.createRadialGradient(CLOUD.x, CLOUD.y, 0, CLOUD.x, CLOUD.y, CLOUD.rx);
  cloud.addColorStop(0, rgba(colors.medium, 0.34));
  cloud.addColorStop(1, rgba(colors.medium, 0));
  ctx.save();
  ctx.translate(CLOUD.x, CLOUD.y);
  ctx.scale(1, CLOUD.ry / CLOUD.rx);
  ctx.translate(-CLOUD.x, -CLOUD.y);
  ctx.fillStyle = cloud;
  ctx.beginPath();
  ctx.arc(CLOUD.x, CLOUD.y, CLOUD.rx, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(215, 219, 228, 0.07)';
  ctx.fillRect(FLOOR.x0, FLOOR.y, FLOOR.x1 - FLOOR.x0, FLOOR.depth);
  if (subsurfaceLit > 0) {
    const glow = ctx.createRadialGradient(560, FLOOR.y + 24, 0, 560, FLOOR.y + 24, 80);
    glow.addColorStop(0, rgba(colors['light-3'], 0.28 * subsurfaceLit));
    glow.addColorStop(1, rgba(colors['light-3'], 0));
    ctx.fillStyle = glow;
    ctx.fillRect(FLOOR.x0, FLOOR.y, FLOOR.x1 - FLOOR.x0, FLOOR.depth);
  }
  ctx.strokeStyle = 'rgba(215, 219, 228, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FLOOR.x0, FLOOR.y);
  ctx.lineTo(WALL.x, FLOOR.y);
  ctx.lineTo(WALL.x, WALL.y0);
  ctx.stroke();

  drawDevice(ctx, PROJECTOR, POINT, 'rgba(215, 219, 228, 0.9)');
  drawDevice(ctx, CAMERA, POINT, 'rgba(215, 219, 228, 0.9)');
}

/**
 * Kinds of light paths between a projector and a camera, one per build
 * step (after Nayar et al. 2006, Fig. 2): each step's `path` (direct,
 * interreflection, subsurface, volumetric) is drawn on a dark render of a
 * side view, in addition to the earlier ones, with its short `label`
 * beside it. `equations` sit beside the render; optional `projectorLabel`
 * and `cameraLabel` name the devices.
 *
 * Content fields: `title`, `subtitle`, `equations` (EquationStack lines
 * `{ tex, step? }`), `buildSteps` (each `{ path, label }`), optional
 * `projectorLabel`, `cameraLabel`.
 */
export default function LightPaths({ slide, buildStep }) {
  const steps = slide.buildSteps;
  for (const step of steps) {
    if (!PATHS[step.path]) throw new Error(`lightPaths: unknown path "${step.path}"`);
  }
  if (!Array.isArray(slide.equations) || slide.equations.some((line) => typeof line.tex !== 'string')) {
    throw new Error('lightPaths: `equations` must be lines `{ tex, step? }`');
  }
  const shown = steps.slice(0, Math.min(buildStep, steps.length - 1) + 1);
  const [ref, ratio] = useStageCanvas();
  const colorsRef = useRef(null);

  useAnimation(`${buildStep}-${ratio}`, 900, (progress) => {
    const canvas = ref.current;
    if (!canvas) return;
    colorsRef.current ??= themeColors(canvas, COLORS);
    const colors = colorsRef.current;
    const ctx = canvas.getContext('2d');
    const scale = ratio * VIEW.scale;
    ctx.setTransform(scale, 0, 0, scale, -VIEW.left * scale, 0);
    const newest = shown.length - 1;
    const fraction = (i) => (i === newest ? ease(progress) : 1);
    const subsurface = shown.findIndex((step) => step.path === 'subsurface');
    drawScene(ctx, colors, subsurface < 0 ? 0 : fraction(subsurface));
    shown.forEach((step, i) => drawPath(ctx, colors, PATHS[step.path], fraction(i)));
  });

  return (
    <div className="slide--light-paths">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="light-paths-body">
        <div className="light-paths-panel" style={{ width: VIEW_SIZE[0], height: VIEW_SIZE[1] }}>
          <canvas
            ref={ref}
            width={Math.round(VIEW_SIZE[0] * ratio)}
            height={Math.round(VIEW_SIZE[1] * ratio)}
            style={{ width: VIEW_SIZE[0], height: VIEW_SIZE[1], display: 'block' }}
          />
          {slide.projectorLabel && (
            <span className="light-paths-device" style={onStage([PROJECTOR[0] - 30, PROJECTOR[1] - 54])}>
              <Text>{slide.projectorLabel}</Text>
            </span>
          )}
          {slide.cameraLabel && (
            <span className="light-paths-device" style={onStage([CAMERA[0] - 40, CAMERA[1] + 26])}>
              <Text>{slide.cameraLabel}</Text>
            </span>
          )}
          {steps.map((step, i) => (
            <motion.span
              key={step.path}
              className={`light-paths-label light-paths-label--${PATHS[step.path].color}`}
              style={onStage(PATHS[step.path].label)}
              initial={false}
              animate={{ opacity: i < shown.length ? 1 : 0 }}
              transition={{ duration: 0.35, delay: i === shown.length - 1 ? 0.5 : 0 }}
            >
              {step.label}
            </motion.span>
          ))}
        </div>
        <div className="light-paths-side">
          <EquationStack lines={slide.equations} step={buildStep} dimEarlier={false} lineClassName="light-paths-equation" />
        </div>
      </div>
    </div>
  );
}
