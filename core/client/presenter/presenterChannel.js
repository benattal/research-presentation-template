import { useCallback, useEffect, useRef } from 'react';
import { PRESENTATION_ID } from '../live/liveApi.js';

/**
 * Same-browser messaging between the audience window and the presenter
 * window (and its preview iframe), over a `BroadcastChannel` named after the
 * presentation so two open presentations never drive each other.
 *
 * Messages:
 *   { type: 'state', index, step }          audience → presenter windows
 *   { type: 'command', command: 'next' | 'previous' | 'request-state' }
 *                                            presenter windows → audience
 */
const CHANNEL_NAME = `${PRESENTATION_ID}:presenter`;

/**
 * Used by the audience window: publishes its position and runs the
 * `next` / `previous` commands the presenter window sends.
 */
export function useAudienceChannel({ position, onCommand }) {
  const channelRef = useRef(null);
  const positionRef = useRef(position);
  const onCommandRef = useRef(onCommand);
  positionRef.current = position;
  onCommandRef.current = onCommand;

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = ({ data }) => {
      if (data.type !== 'command') return;
      if (data.command === 'request-state') {
        channel.postMessage({ type: 'state', ...positionRef.current });
      } else {
        onCommandRef.current(data.command);
      }
    };
    return () => channel.close();
  }, []);

  useEffect(() => {
    channelRef.current?.postMessage({ type: 'state', ...position });
  }, [position]);
}

/**
 * Used by the presenter window and its preview: receives the audience
 * window's position (`onState({ index, step })`) and returns `send(command)`.
 * On mount it asks the audience window for its current position.
 */
export function usePresenterChannel(onState) {
  const channelRef = useRef(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = ({ data }) => {
      if (data.type === 'state') onStateRef.current({ index: data.index, step: data.step });
    };
    channel.postMessage({ type: 'command', command: 'request-state' });
    return () => channel.close();
  }, []);

  return useCallback((command) => {
    channelRef.current?.postMessage({ type: 'command', command });
  }, []);
}
