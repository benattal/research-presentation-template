import { createHmac, timingSafeEqual } from 'node:crypto';

function sameText(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Presenter login for the live server.
 *
 * The password comes from the server's environment (`PRESENTER_PASSWORD`).
 * A correct password is exchanged for a token derived from it, which the
 * presenter's browser sends as `Authorization: Bearer <token>`. The token
 * stays valid across restarts and changes when the password does.
 */
export function createPresenterAuth(password) {
  if (typeof password !== 'string' || password === '') {
    throw new Error(
      'PRESENTER_PASSWORD is not set. Add it to .env at the repository root '
      + '(see .env.example) or to the hosting service\'s environment.',
    );
  }
  const token = createHmac('sha256', password).update('presenter-token').digest('hex');

  return {
    /** POST handler: `{ password }` → `{ token }` or 401. */
    verify(req, res) {
      const given = req.body?.password;
      if (typeof given !== 'string') return res.status(400).json({ error: 'password required' });
      if (!sameText(given, password)) return res.status(401).json({ error: 'Invalid password' });
      return res.json({ token });
    },

    /** Middleware that rejects requests without the presenter token. */
    requirePresenter(req, res, next) {
      const header = req.headers.authorization ?? '';
      if (!header.startsWith('Bearer ') || !sameText(header.slice(7), token)) {
        return res.status(401).json({ error: 'Presenter authentication required' });
      }
      return next();
    },
  };
}
