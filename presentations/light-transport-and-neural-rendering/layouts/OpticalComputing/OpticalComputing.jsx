import { useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useStepTransition } from '../canvas/canvas.js';
import RoomView from '../flatland/RoomView.jsx';
import {
  ELEMENT_EMISSION, angleBetween, dominantEigenvector, elementReturns, lightElementRoom, oneHot, powerIteration,
} from '../flatland/lightElements.js';
import { derived, SURFACE_GAIN } from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom } from '../flatland/render.js';
import {
  Strip, drawElements, elementAt, exposures, patternPicture,
} from '../TransportMatrix/elementViews.jsx';
import './OpticalComputing.css';

const ROOM = ROOM_VIEW;
const STRIP_SIZE = [228, 26];
/** Patterns are drawn with this total weight, so every photo is equally bright. */
const DISPLAY_TOTAL = 2;

/** A pattern scaled to total weight DISPLAY_TOTAL (power iteration fixes only its direction). */
function displayed(p) {
  const total = p.reduce((sum, value) => sum + value, 0);
  return p.map((value) => (value * DISPLAY_TOTAL) / total);
}

/** A pattern as a 1D image of the elements' light, RGB per element, its brightest element at 1. */
function patternImage(p) {
  const largest = Math.max(...p);
  const image = new Float64Array(p.length * 3);
  p.forEach((value, k) => {
    for (let c = 0; c < 3; c += 1) image[k * 3 + c] = (value / largest) * (ELEMENT_EMISSION[c] / ELEMENT_EMISSION[0]);
  });
  return image;
}

/** The glow drawn on a ceiling element lit at `w` of the brightest one. */
const elementGlow = (w) => `rgba(255, 241, 201, ${(0.1 + 0.9 * w).toFixed(3)})`;

/**
 * Power iteration as photographs: the light elements on the ceiling also
 * measure the light that returns to them, so lighting the room with
 * pattern p and reading the elements gives Tp in one photograph. Each
 * build step `{ photos: t }` lights the room with p_t, the pattern after t
 * photos, p_{t+1} = Tp_t / ‖Tp_t‖, starting from one element (`start`,
 * default 1, left to right from 0). Beside the room: each step's pattern
 * as a strip of light, its angle to the dominant eigenvector v_1 of T
 * (computed from the full matrix), and the count of photos against the
 * number of elements. Clicking an element on the ceiling restarts from it.
 *
 * Content fields: `title`, `subtitle`, `equations` (display lines above
 * the patterns), optional `labels` (short lines under them), optional
 * `start`, `buildSteps`.
 */
export default function OpticalComputing({ slide, buildStep }) {
  if (!Array.isArray(slide.equations)) throw new Error('opticalComputing: `equations` is required');
  const env = lightElementRoom();
  const K = env.elements.length;
  const T = useMemo(() => derived(env.B[0], 'element-returns', () => elementReturns(env)), [env]);
  const v1 = useMemo(() => dominantEigenvector(T, K), [T, K]);
  const [start, setStart] = useState(slide.start ?? 1);
  const counts = slide.buildSteps.map((entry) => entry.photos);
  if (counts.some((t) => !Number.isInteger(t) || t < 0)) throw new Error('opticalComputing: every build step needs a whole number of "photos"');
  const patterns = useMemo(() => powerIteration(T, oneHot(K, start), Math.max(...counts)), [T, K, start, counts.join(',')]);
  const step = Math.min(buildStep, counts.length - 1);
  const gains = useMemo(() => exposures(env, displayed(v1)), [env, v1]);
  const stripGain = 1.6;

  const fromStep = useStepTransition(step);
  const from = fromStep !== null ? patterns[counts[fromStep]] : null;
  const current = patterns[counts[step]];

  const paint = (ctx, progress) => {
    const a = from ? ease(progress) : 1;
    const p = displayed(current).map((value, k) => a * value + (1 - a) * (from ? displayed(from)[k] : 0));
    const picture = patternPicture(env, p);
    const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width: ROOM[0], height: ROOM[1] }, {
      table: env.table,
      fluence: picture.fluence,
      fluenceGain: gains.room,
      surfaces: picture.surfaces,
      surfaceGain: gains.room * SURFACE_GAIN,
    });
    drawElements(ctx, transform, env.elements, p, elementGlow);
  };

  const pick = (event, point) => {
    const k = elementAt(env, point, ROOM);
    if (k >= 0) setStart(k);
  };

  return (
    <div className="slide--optical-computing">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="optical-body">
        <div data-no-swipe>
          <RoomView
            width={ROOM[0]}
            height={ROOM[1]}
            paint={paint}
            animationKey={`${step}|${start}`}
            duration={from ? 900 : 0}
            className="optical-room"
            onPointerDown={pick}
          />
        </div>
        <div className="optical-side">
          {slide.equations.map((line) => (
            <div key={line} className="optical-equation"><Text>{line}</Text></div>
          ))}
          {(slide.labels ?? []).map((line) => (
            <p key={line} className="optical-label"><Text>{line}</Text></p>
          ))}
          <ol className="optical-patterns">
            {counts.map((t, i) => (
              <li key={t} className={i === step ? 'optical-current' : (i < step ? '' : 'optical-later')}>
                <span className="optical-name"><Text>{`$p_{${t}}$`}</Text></span>
                <Strip image={patternImage(patterns[t])} gain={stripGain} width={STRIP_SIZE[0]} height={STRIP_SIZE[1]} />
                <span className="optical-angle">{i <= step ? `${angleBetween(patterns[t], v1).toFixed(1)}°` : ''}</span>
              </li>
            ))}
            <li className="optical-eigenvector">
              <span className="optical-name"><Text>{'$v_1$'}</Text></span>
              <Strip image={patternImage(v1)} gain={stripGain} width={STRIP_SIZE[0]} height={STRIP_SIZE[1]} />
              <span className="optical-angle" />
            </li>
          </ol>
          <dl className="optical-count">
            <dt>photos</dt>
            <dd>{counts[step]}</dd>
            <dt>light elements</dt>
            <dd>{K}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
