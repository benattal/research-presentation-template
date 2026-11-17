/**
 * The spotlight's beam and its first scattering off the floor, for each
 * floor finish: what the floorScattering layout draws, and the fraction of
 * the beam's flux the floor sends back (the same for every finish, because
 * a BRDF redistributes light without changing how much is reflected).
 */
import { derived } from '../flatland/pictures.js';
import { flatlandRoom } from '../flatland/rooms.js';
import { addVectors, bounce, outgoingFlux } from '../flatland/transport.js';

/**
 * The room lit by the spotlight with `floor` as its floor finish, and the
 * light to draw: the beam alone (`scattered` false) or the beam plus the
 * light the floor scatters once (e + Ae). The vectors are cached per room.
 */
export function beamPicture(floor, scattered) {
  const env = flatlandRoom(floor, 'spot');
  const beam = env.transport.emission;
  const state = scattered
    ? derived(beam, 'scattered-once', () => addVectors(beam, bounce(env.transport, beam)))
    : beam;
  return { env, state };
}

/** Flux leaving the floor after one bounce, as a fraction of the beam's flux. */
export function reflectedFraction(floor) {
  const { transport } = flatlandRoom(floor, 'spot');
  const beam = transport.emission;
  return outgoingFlux(transport, bounce(transport, beam)) / outgoingFlux(transport, beam);
}
