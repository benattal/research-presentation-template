/**
 * Server-sent event streams grouped by topic (one topic per poll, one for
 * the presenter's position).
 */

/** Seconds between keep-alive comments; proxies close idle connections. */
const KEEP_ALIVE_SECONDS = 25;

export function createEventStreams() {
  const subscribers = new Map();

  return {
    /**
     * Turn `res` into an event stream subscribed to `topic`. `initial`, if
     * given, is sent at once so a new subscriber does not wait for a change.
     */
    subscribe(topic, req, res, initial) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      if (initial !== undefined) res.write(`data: ${JSON.stringify(initial)}\n\n`);

      if (!subscribers.has(topic)) subscribers.set(topic, new Set());
      subscribers.get(topic).add(res);

      const keepAlive = setInterval(() => res.write(':\n\n'), KEEP_ALIVE_SECONDS * 1000);
      req.on('close', () => {
        clearInterval(keepAlive);
        subscribers.get(topic)?.delete(res);
      });
    },

    /** Send `data` to every subscriber of `topic`. */
    publish(topic, data) {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      for (const res of subscribers.get(topic) ?? []) res.write(message);
    },
  };
}
