/* global __LIVE_SERVER__, __PRESENTATION_ID__ */
import { useEffect, useRef, useState } from 'react';

/**
 * True when the Express gateway hosts this build (`npm run serve`,
 * `npm start`), false for local Vite and static builds. The hosting script
 * sets it through `core/tooling/viteConfig.js`; nothing else decides it.
 */
export const LIVE_SERVER = __LIVE_SERVER__;

/** The presentation's directory name, used to namespace browser storage. */
export const PRESENTATION_ID = __PRESENTATION_ID__;

/** Settings a build without a live server behaves as if it had received. */
const LOCAL_SETTINGS = { votingOpen: false, presenterControlled: false };

/** URL of a live-server endpoint, e.g. `apiUrl('poll/q1/stream')`. */
export function apiUrl(path) {
  return `${import.meta.env.BASE_URL}api/${path}`;
}

/**
 * POST a JSON body to a live-server endpoint and return the parsed reply.
 * Throws on a network failure or a non-2xx status.
 */
export async function postJson(path, body, token) {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) throw new Error(`POST ${path}: HTTP ${response.status}`);
  return response.json();
}

let settingsRequest = null;

/**
 * The server's live settings, `{ votingOpen, presenterControlled }`, or
 * `null` while the first request is in flight. Fetched once per page.
 * The server owns these switches (`VOTING_DISABLED`, `PRESENTER_CONTROLLED`
 * in its environment); the client never reads a copy of its own.
 */
export function useLiveSettings() {
  const [settings, setSettings] = useState(LIVE_SERVER ? null : LOCAL_SETTINGS);

  useEffect(() => {
    if (!LIVE_SERVER) return undefined;
    let cancelled = false;
    settingsRequest ??= fetch(apiUrl('settings')).then((response) => response.json());
    settingsRequest
      .then((received) => { if (!cancelled) setSettings(received); })
      .catch(() => { if (!cancelled) setSettings(LOCAL_SETTINGS); });
    return () => { cancelled = true; };
  }, []);

  return settings;
}

/**
 * Subscribe to a server-sent event stream while `enabled`. `onMessage`
 * receives each event's parsed JSON data. Returns whether the stream is
 * open. EventSource reconnects by itself after a network drop.
 */
export function useEventStream(path, onMessage, enabled = true) {
  const [open, setOpen] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return undefined;
    const source = new EventSource(apiUrl(path));
    source.onopen = () => setOpen(true);
    source.onerror = () => setOpen(false);
    source.onmessage = (event) => onMessageRef.current(JSON.parse(event.data));
    return () => {
      source.close();
      setOpen(false);
    };
  }, [path, enabled]);

  return open;
}
