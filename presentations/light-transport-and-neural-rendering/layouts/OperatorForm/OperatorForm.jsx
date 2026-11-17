import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '../canvas/canvas.js';
import EquationLines from '../volume/EquationLines.jsx';
import { drawPanel, glowDot, rgba, themeColors } from '../volume/draw.js';
import { useFigureSize } from '../volume/figure.js';
import './OperatorForm.css';

/** The direction ω of the drawn ray, as an angle above the horizontal (radians). */
const RAY_ANGLE = -0.32;
/** Directions the in-scattering stencil gathers from. */
const GATHER_DIRECTIONS = 18;

/** A soft purple haze: the medium both stencils sit in. */
function drawMedium(ctx, rect, colors) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, rect.width * 0.45);
  haze.addColorStop(0, rgba(colors.medium, 0.32));
  haze.addColorStop(1, rgba(colors.medium, 0));
  ctx.fillStyle = haze;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function glowSegment(ctx, [ax, ay], [bx, by], color, alpha, width) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(color, alpha * 0.35);
  ctx.lineWidth = width * 4;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function arrowHead(ctx, [x, y], angle, color, size) {
  ctx.save();
  ctx.fillStyle = rgba(color);
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.7, size * 0.6);
  ctx.lineTo(-size * 0.7, -size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * What each operator needs to know about L at a point x, drawn as light:
 * D (ω·∇ + σₜ) needs L just before and after x on the ray through x in
 * direction ω; K (σₛ∫f_p L dω') needs L arriving at x from every direction.
 */
const STENCILS = {
  D(ctx, rect, colors) {
    const center = [rect.x + rect.width / 2, rect.y + rect.height / 2];
    const direction = [Math.cos(RAY_ANGLE), Math.sin(RAY_ANGLE)];
    const far = rect.width * 0.6;
    const at = (s) => [center[0] + direction[0] * s, center[1] + direction[1] * s];
    glowSegment(ctx, at(-far), at(far), [255, 255, 255], 0.25, 1);
    glowSegment(ctx, at(-rect.width * 0.09), at(rect.width * 0.09), colors['light-1'], 1, 3);
    arrowHead(ctx, at(rect.width * 0.09 + 6), RAY_ANGLE, colors['light-1'], 9);
    glowDot(ctx, center, colors['light-0'], 4);
  },
  K(ctx, rect, colors) {
    const center = [rect.x + rect.width / 2, rect.y + rect.height / 2];
    const reach = rect.height * 0.42;
    for (let i = 0; i < GATHER_DIRECTIONS; i += 1) {
      const angle = (2 * Math.PI * (i + 0.5)) / GATHER_DIRECTIONS;
      const from = [center[0] + Math.cos(angle) * reach, center[1] + Math.sin(angle) * reach];
      const near = [center[0] + Math.cos(angle) * 12, center[1] + Math.sin(angle) * 12];
      glowSegment(ctx, from, near, colors['light-2'], 0.55, 1.5);
    }
    const out = [center[0] + Math.cos(RAY_ANGLE) * reach * 1.25, center[1] + Math.sin(RAY_ANGLE) * reach * 1.25];
    glowSegment(ctx, center, out, colors['light-1'], 1, 3);
    arrowHead(ctx, out, RAY_ANGLE, colors['light-1'], 9);
    glowDot(ctx, center, colors['light-0'], 4);
  },
};

/**
 * The radiative transfer equation regrouped into operators, one equation
 * line per build step, beside drawings of what each operator needs at a
 * point: a derivative along one ray for D, light from every direction for K.
 *
 * Slide fields: build steps `{ label?, equation }` (see EquationLines), and
 * `stencils`: `[{ operator: 'D' | 'K', label, step }]`. Each stencil's
 * panel of medium shows from the first step; the stencil and its label are
 * drawn from build step `step`.
 */
export default function OperatorForm({ slide, buildStep }) {
  for (const stencil of slide.stencils) {
    if (!STENCILS[stencil.operator]) throw new Error(`operatorForm: unknown operator "${stencil.operator}"`);
  }
  const [colors, setColors] = useState(null);
  const [figureRef, size] = useFigureSize();
  const [canvasRef, ratio] = useStageCanvas();
  useLayoutEffect(() => setColors(themeColors(canvasRef.current)), [canvasRef]);

  const panels = useMemo(() => {
    const gap = 46;
    const height = Math.max(0, (size.height - gap * slide.stencils.length) / slide.stencils.length);
    return slide.stencils.map((stencil, i) => ({
      ...stencil,
      rect: { x: 0, y: i * (height + gap), width: size.width, height },
    }));
  }, [size, slide.stencils]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors || size.width === 0) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    // The medium shows from the first step, so the equation of the medium has its picture;
    // each operator's stencil is drawn into it from its own step.
    for (const panel of panels) {
      drawPanel(ctx, panel.rect, colors['render-bg']);
      ctx.save();
      ctx.beginPath();
      ctx.rect(panel.rect.x, panel.rect.y, panel.rect.width, panel.rect.height);
      ctx.clip();
      drawMedium(ctx, panel.rect, colors);
      if (buildStep >= panel.step) STENCILS[panel.operator](ctx, panel.rect, colors);
      ctx.restore();
    }
  }, [canvasRef, colors, size, ratio, panels, buildStep]);
  useLayoutEffect(draw, [draw]);

  return (
    <div className="slide--operator-form">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="operator-form-body">
        <EquationLines lines={slide.buildSteps} buildStep={buildStep} className="operator-form-lines" />
        <div className="operator-form-figure" ref={figureRef}>
          <canvas
            ref={canvasRef}
            className="operator-form-canvas"
            width={Math.round(size.width * ratio)}
            height={Math.round(size.height * ratio)}
            style={{ width: size.width, height: size.height }}
          />
          {panels.map((panel) => (
            <span
              key={panel.operator}
              className="operator-form-label"
              style={{ top: panel.rect.y + panel.rect.height + 8, visibility: buildStep >= panel.step ? 'visible' : 'hidden' }}
            >
              <Text>{panel.label}</Text>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
