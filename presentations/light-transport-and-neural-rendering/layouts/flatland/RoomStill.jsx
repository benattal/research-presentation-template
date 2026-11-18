import { useEffect } from 'react';
import { useStageCanvas } from '@core/stage/canvas.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain, subtract } from './pictures.js';
import { MEASURED_PIXEL, flatlandRoom } from './rooms.js';
import { drawRoom } from './render.js';
import { fluence, patchRadiosity } from './transport.js';

/**
 * Still renders of the room, by name, for title and section slides:
 *
 * - `light`: the lamp's steady state, every bounce;
 * - `spot`: the spotlight's steady state;
 * - `pulse`: the lamp's light in flight, a pulse halfway across the room;
 * - `importance`: the measured pixel's importance, in cyan.
 */
const STILLS = {
  light: () => {
    const env = flatlandRoom('diffuse', 'lamp');
    const gain = sceneGain(env, false);
    return { env, fluence: cachedFluence(env.table, env.steady, Infinity, 'source'), gain, surfaces: patchRadiosity(env.transport, env.steady), palette: 'light' };
  },
  spot: () => {
    const env = flatlandRoom('glossy', 'spot');
    const gain = sceneGain(env, false) * 1.4;
    return { env, fluence: cachedFluence(env.table, env.steady, Infinity, 'source'), gain, surfaces: patchRadiosity(env.transport, env.steady), palette: 'light' };
  },
  pulse: () => {
    const env = flatlandRoom('diffuse', 'lamp');
    const gain = sceneGain(env, false);
    const light = derived(env.transport.emission, 'pulse-still', () => fluence(env.table, env.transport.emission, 4.2, { pulse: { width: 1.2, trail: 0.2 } }));
    return { env, fluence: light, gain, surfaces: patchRadiosity(env.transport, env.transport.emission), palette: 'light' };
  },
  importance: () => {
    const env = flatlandRoom('diffuse', 'lamp');
    const gain = sceneGain(env, true);
    const scattered = derived(env.importance, 'without-sensor', () => subtract(env.importance, env.sensor));
    return { env, fluence: cachedFluence(env.table, scattered, Infinity, 'source'), gain, surfaces: patchRadiosity(env.transport, env.importance), palette: 'importance', camera: true };
  },
};

/** A still render of the flatland room (`kind` as in STILLS), `width` × `height` stage pixels. */
export default function RoomStill({ kind, width, height, className }) {
  const [ref, ratio] = useStageCanvas();
  useEffect(() => {
    const still = STILLS[kind];
    if (!still) throw new Error(`Unknown room still "${kind}"`);
    const { env, fluence: light, gain, surfaces, palette, camera } = still();
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawRoom(ctx, env.room, { x: 0, y: 0, width, height }, {
      table: env.table,
      fluence: light,
      fluenceGain: gain,
      surfaces,
      surfaceGain: gain * SURFACE_GAIN,
      palette,
      camera: Boolean(camera),
      pixel: camera ? MEASURED_PIXEL : null,
    });
  }, [ref, ratio, kind, width, height]);
  return (
    <canvas
      ref={ref}
      className={className}
      width={Math.round(width * ratio)}
      height={Math.round(height * ratio)}
      style={{ width, height, display: 'block', borderRadius: 6 }}
    />
  );
}
