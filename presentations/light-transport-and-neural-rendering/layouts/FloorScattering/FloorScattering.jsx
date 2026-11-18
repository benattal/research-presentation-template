import { useEffect, useMemo } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '@core/stage/canvas.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain } from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom } from '../flatland/render.js';
import { patchRadiosity } from '../flatland/transport.js';
import { beamPicture, reflectedFraction } from './reflection.js';
import './FloorScattering.css';

/** Size of the room render, in stage pixels (10 × 6 room units). */
const ROOM_SIZE = ROOM_VIEW;
/** The spotlight's beam is narrow: expose it brighter than the lamp's room. */
const SPOT_EXPOSURE = 3;

/**
 * One beam of light in the flatland room, then what the floor does with
 * it. Each build step is `{ floor, label }`: `floor` null draws the beam
 * alone (radiance unchanged along the ray); 'diffuse', 'glossy', or
 * 'mirror' adds the light that floor finish scatters once. Beside the
 * render, each step's label, and for each finish, under the heading
 * "reflected" (shown with the first fraction), the fraction of the beam's
 * flux the floor reflects (the check: equal for every finish).
 */
export default function FloorScattering({ slide, buildStep }) {
  const steps = slide.buildSteps;
  const step = steps[Math.min(buildStep, steps.length - 1)];
  const [ref, ratio] = useStageCanvas();
  const [width, height] = ROOM_SIZE;

  const fractions = useMemo(
    () => Object.fromEntries(steps.filter((s) => s.floor).map((s) => [s.floor, reflectedFraction(s.floor)])),
    [steps],
  );
  // The heading shows with the first fraction under it; until then it keeps its place.
  const firstFraction = steps.findIndex((s) => s.floor);
  const headed = firstFraction >= 0 && buildStep >= firstFraction;

  useEffect(() => {
    const { env, state } = beamPicture(step.floor ?? 'diffuse', Boolean(step.floor));
    const gain = sceneGain(env, false) * SPOT_EXPOSURE;
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawRoom(ctx, env.room, { x: 0, y: 0, width, height }, {
      table: env.table,
      fluence: cachedFluence(env.table, state, Infinity, 'source'),
      fluenceGain: gain,
      surfaces: derived(state, 'radiosity', () => patchRadiosity(env.transport, state)),
      surfaceGain: gain * SURFACE_GAIN,
      palette: 'light',
    });
  }, [ref, ratio, step, width, height]);

  return (
    <div className="slide--floor-scattering">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="floor-scattering-main">
        <canvas
          ref={ref}
          className="floor-scattering-room"
          width={Math.round(width * ratio)}
          height={Math.round(height * ratio)}
          style={{ width, height }}
        />
        {/* A grid of two columns (label, fraction); each row's <li> only groups its cells. */}
        <ol className="floor-scattering-states">
          <li className="floor-scattering-header">
            <span />
            <span style={{ visibility: headed ? 'visible' : 'hidden' }}>reflected</span>
          </li>
          {steps.map((s, i) => (
            <li
              key={s.label}
              className={i === buildStep ? 'floor-scattering-state--current' : i < buildStep ? 'floor-scattering-state--shown' : ''}
            >
              <span className="floor-scattering-label"><Text>{s.label}</Text></span>
              <span className="floor-scattering-fraction">
                {s.floor && i <= buildStep ? `${Math.round(100 * fractions[s.floor])}%` : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
