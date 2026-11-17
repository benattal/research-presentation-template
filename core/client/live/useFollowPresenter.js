import { useEffect, useRef } from 'react';
import { LIVE_SERVER, postJson, useEventStream, useLiveSettings } from './liveApi.js';

/**
 * Follow-the-presenter mode, when the live server has it switched on
 * (`PRESENTER_CONTROLLED=true` in the server's environment).
 *
 * The presenter's windows publish their position on every change; every
 * other browser receives it through an event stream and moves to it, and
 * its own navigation is disabled. Returns `{ following }`: true while this
 * browser is being driven by the presenter.
 */
export default function useFollowPresenter({ position, setPosition, isPresenter, token }) {
  const settings = useLiveSettings();
  const active = LIVE_SERVER && settings?.presenterControlled === true;
  const following = active && !isPresenter;
  const lastPublished = useRef(null);

  useEffect(() => {
    if (!active || !isPresenter || !token) return;
    const key = `${position.index}:${position.step}`;
    if (lastPublished.current === key) return;
    lastPublished.current = key;
    postJson('slide-sync/position', position, token).catch(() => {
      lastPublished.current = null;
    });
  }, [active, isPresenter, token, position]);

  useEventStream('slide-sync/stream', setPosition, following);

  return { following };
}
