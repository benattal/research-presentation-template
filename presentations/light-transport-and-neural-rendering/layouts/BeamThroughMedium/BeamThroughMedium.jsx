import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useAnimation, useStageCanvas } from '../canvas/canvas.js';
import { drawPanel, glowDot, rgba, themeColors } from '../volume/draw.js';
import { useFigureSize } from '../volume/figure.js';
import { createRandom } from '../volume/random.js';
import { BEAM, LAMP, PANEL, SLAB, photonPosition, simulateSlab } from './photons.js';
import './BeamThroughMedium.css';

const PROCESSES = ['absorption', 'outScattering', 'emission', 'inScattering'];
/** Room under the panel for the slab's thickness mark, in stage pixels. */
const MARK_SPACE = 34;
/** How long the photons fly before the picture settles, in seconds; a longer path appears whole at the end. */
const FLIGHT = 5.5;
/** Grains drawn in the slab: the number shown grows with σₜ. */
const GRAINS = Array.from({ length: 400 }, (_, i) => {
  const random = createRandom(1000 + i);
  return [SLAB.start + (SLAB.end - SLAB.start) * random(), SLAB.bottom + (SLAB.top - SLAB.bottom) * random()];
});

/**
 * How each kind of light is drawn: its color (a `--light-*` token), the
 * opacity of one photon's trail (trails add up, as light does), and its
 * width.
 */
const TRAILS = {
  beam: { color: 'light-1', alpha: 0.022, width: 1.4 },
  lamp: { color: 'light-1', alpha: 0.014, width: 1.2 },
  emitted: { color: 'light-0', alpha: 0.24, width: 1.1 },
  scattered: { color: 'light-2', alpha: 0.16, width: 1.1 },
  inScattered: { color: 'light-2', alpha: 0.75, width: 1.6 },
};

function panelGeometry({ width, height }) {
  const aspect = PANEL.width / PANEL.height;
  const panelWidth = Math.max(0, Math.min(width, (height - MARK_SPACE) * aspect));
  return { panel: { x: 0, y: 0, width: panelWidth, height: panelWidth / aspect }, width: panelWidth, height };
}

/** The trail style of segment `i` of a photon. */
function trailOf(photon, i, inScatteringShown) {
  if (inScatteringShown && photon.inScattered >= 0 && i >= photon.inScattered) return TRAILS.inScattered;
  if (photon.segmentBounces[i] > 0) return TRAILS.scattered;
  return TRAILS[photon.kind];
}

/**
 * Photons crossing a slab of medium, one term of the radiative transfer
 * equation per build step: absorbed photons end in the medium, out-scattered
 * ones turn away, the medium emits new ones, and a lamp's light scatters
 * into the beam. Trails add up like a long exposure. Once a loss term is
 * shown, the side states the slab's transmittance, e^{−(σₐ + σₛ)d}; the
 * simulation's beam matches it (tests/volume.test.mjs).
 *
 * Slide fields: `lhs` (math) and its optional short `lhsLabel`, `terms`
 * (`[{ process, math, label, className }]`, process one of absorption,
 * outScattering, emission, inScattering), `absorption` and `scattering`
 * (σₐ and σₛ per unit length at first), build steps `{ terms: n }`
 * showing the first n terms, and optional `definitions`
 * (`[{ text, step }]`): short lines naming a term's symbols, shown in the
 * side column from build step `step`.
 */
export default function BeamThroughMedium({ slide, buildStep }) {
  const step = slide.buildSteps?.[buildStep];
  if (!Number.isInteger(step?.terms)) {
    throw new Error(`beamThroughMedium: build step ${buildStep} of "${slide.id}" needs "terms"`);
  }
  for (const term of slide.terms) {
    if (!PROCESSES.includes(term.process)) throw new Error(`beamThroughMedium: unknown process "${term.process}"`);
  }
  if (!(slide.absorption >= 0 && slide.scattering >= 0)) {
    throw new Error(`beamThroughMedium: slide "${slide.id}" needs "absorption" and "scattering"`);
  }

  const [absorption, setAbsorption] = useState(slide.absorption);
  const [scattering, setScattering] = useState(slide.scattering);
  const [colors, setColors] = useState(null);
  const [figureRef, size] = useFigureSize();
  const [canvasRef, ratio] = useStageCanvas();
  const progressRef = useRef(1);
  const stepRef = useRef(buildStep);
  if (stepRef.current !== buildStep) {
    stepRef.current = buildStep;
    progressRef.current = 0;
  }

  useLayoutEffect(() => setColors(themeColors(canvasRef.current)), [canvasRef]);
  const geometry = useMemo(() => panelGeometry(size), [size]);

  const active = useMemo(() => Object.fromEntries(PROCESSES.map((process) => [
    process, slide.terms.slice(0, step.terms).some((term) => term.process === process),
  ])), [slide.terms, step.terms]);

  const simulation = useMemo(
    () => simulateSlab({ absorption, scattering, terms: active, seed: 17 + buildStep }),
    [absorption, scattering, active, buildStep],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors || geometry.width === 0) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, geometry.width, geometry.height);
    const { panel } = geometry;
    const scale = panel.width / PANEL.width;
    const toCanvas = ([x, y]) => [panel.x + x * scale, panel.y + (PANEL.height - y) * scale];
    const settled = progressRef.current >= 1;
    const now = progressRef.current * FLIGHT;
    const extinction = simulation.check.extinction;

    drawPanel(ctx, panel, colors['render-bg']);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(panel.x, panel.y, panel.width, panel.height, 6);
    ctx.clip();

    // The slab: a faint haze and grains, both denser as σₜ grows.
    const [slabLeft, slabTop] = toCanvas([SLAB.start, SLAB.top]);
    const [slabRight, slabBottom] = toCanvas([SLAB.end, SLAB.bottom]);
    ctx.fillStyle = rgba(colors.medium, 0.07 + 0.035 * Math.min(4, extinction));
    ctx.fillRect(slabLeft, slabTop, slabRight - slabLeft, slabBottom - slabTop);
    ctx.fillStyle = rgba(colors.medium, 0.3);
    GRAINS.slice(0, Math.round(70 * Math.min(5, extinction))).forEach((grain) => {
      const [x, y] = toCanvas(grain);
      ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
    });

    // The trails, up to where each photon is now.
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const heads = [];
    const embers = [];
    for (const photon of simulation.photons) {
      const position = settled ? { segment: photon.points.length - 2, point: photon.points.at(-1), done: true }
        : photonPosition(photon, now - photon.start);
      if (!position) continue;
      for (let i = 0; i <= position.segment; i += 1) {
        const trail = trailOf(photon, i, active.inScattering);
        const end = i === position.segment ? position.point : photon.points[i + 1];
        const [ax, ay] = toCanvas(photon.points[i]);
        const [bx, by] = toCanvas(end);
        ctx.strokeStyle = rgba(colors[trail.color], trail.alpha);
        ctx.lineWidth = trail.width;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      if (position.done && photon.fate === 'absorbed') embers.push(toCanvas(position.point));
      else if (!position.done) heads.push([toCanvas(position.point), trailOf(photon, position.segment, active.inScattering)]);
    }
    // Where photons were absorbed: small specks of the medium's color.
    ctx.fillStyle = rgba(colors.medium, 0.6);
    for (const [x, y] of embers) {
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (const [[x, y], trail] of heads) {
      ctx.fillStyle = rgba(colors[trail.color], 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();

    // The beam's source and, with in-scattering, the lamp.
    glowDot(ctx, toCanvas([0.02, BEAM.y]), colors['light-1'], 4);
    if (active.inScattering) glowDot(ctx, toCanvas([LAMP.x, LAMP.y - 0.02]), colors['light-0'], 6);

    // The slab's thickness d, under the panel.
    const markY = panel.y + panel.height + 12;
    ctx.strokeStyle = rgba(colors['text-muted']);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(slabLeft, markY - 5);
    ctx.lineTo(slabLeft, markY + 5);
    ctx.moveTo(slabLeft, markY);
    ctx.lineTo(slabRight, markY);
    ctx.moveTo(slabRight, markY - 5);
    ctx.lineTo(slabRight, markY + 5);
    ctx.stroke();
  }, [canvasRef, colors, geometry, ratio, simulation, active]);

  useAnimation(buildStep, FLIGHT * 1000, (progress) => {
    progressRef.current = progress;
    draw();
  });
  useLayoutEffect(draw, [draw]);

  const slabMiddle = geometry.panel.width * ((SLAB.start + SLAB.end) / 2 / PANEL.width);
  const slider = (label, value, set, enabled) => (
    <label className={`beam-slider${enabled ? '' : ' beam-slider--off'}`}>
      <Text>{label}</Text>
      <input
        type="range"
        min={0}
        max={3}
        step={0.01}
        value={value}
        disabled={!enabled}
        onChange={(event) => set(Number(event.target.value))}
        // The clicker sends arrow and page keys; a focused slider would take them.
        onPointerUp={(event) => event.currentTarget.blur()}
      />
    </label>
  );

  return (
    <div className="slide--beam">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="beam-equation">
        <span className="beam-term beam-term--lhs">
          <Text>{`$${slide.lhs}$`}</Text>
          {slide.lhsLabel && <span className="beam-term-label">{slide.lhsLabel}</span>}
        </span>
        <span className="beam-term"><Text>{'$=$'}</Text></span>
        {/* With no term shown, the right side is 0, drawn where the first term will appear. */}
        <span className="beam-zero-slot">
          <span className="beam-zero" style={{ opacity: step.terms === 0 ? 1 : 0 }}><Text>{'$0$'}</Text></span>
        </span>
        {slide.terms.map((term, i) => {
          const shown = i < step.terms;
          const newest = i === step.terms - 1;
          return (
            <span
              key={term.process}
              className={`beam-term ${term.className ?? ''}`}
              style={{ opacity: shown ? (newest ? 1 : 0.55) : 0 }}
            >
              <Text>{`$${term.math}$`}</Text>
              <span className="beam-term-label">{term.label}</span>
            </span>
          );
        })}
      </div>
      <div className="beam-body">
        <div className="beam-figure" ref={figureRef}>
          <canvas
            ref={canvasRef}
            className="beam-canvas"
            width={Math.round(geometry.width * ratio)}
            height={Math.round(geometry.height * ratio)}
            style={{ width: geometry.width, height: geometry.height }}
          />
          {geometry.width > 0 && (
            <span className="beam-mark" style={{ left: slabMiddle - 10, top: geometry.panel.height + 16 }}>
              <Text>{'$d$'}</Text>
            </span>
          )}
        </div>
        <div className="beam-side" data-no-swipe>
          {slider('$\\sigma_a$', absorption, setAbsorption, active.absorption)}
          {slider('$\\sigma_s$', scattering, setScattering, active.outScattering)}
          {/* Space reserved from the first step, so nothing moves when the losses appear. */}
          <div className="beam-transmittance" style={{ visibility: active.absorption || active.outScattering ? 'visible' : 'hidden' }}>
            <span className="beam-transmittance-label">transmittance</span>
            <Text>{'$T = e^{-(\\sigma_a + \\sigma_s)\\, d}$'}</Text>
          </div>
          {/* Symbols the terms introduce, each from its build step; their space is reserved, so nothing moves. */}
          <div className="beam-definitions">
            {(slide.definitions ?? []).map((definition) => (
              <span key={definition.text} style={{ visibility: buildStep >= definition.step ? 'visible' : 'hidden' }}>
                <Text>{definition.text}</Text>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
