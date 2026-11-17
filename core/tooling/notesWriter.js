import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePath } from 'vite';
import { notesFileName } from '../client/presentation/model.js';

const SLIDE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf-8');
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

/**
 * Vite plugin, development server only: lets the presenter window save
 * edited notes back to `slides/<slide-id>/notes*.md`
 * (`PUT <base>__presenter-notes/<slide-id>?step=<step>`, body = the notes).
 *
 * Only requests from this machine are accepted, so an audience on the same
 * network cannot write files. A file written here is excluded from hot
 * reload: the presenter window already shows the new text, and reloading
 * would interrupt the audience view mid-talk.
 */
export function notesWriter(presentation) {
  const justWritten = new Set();

  return {
    name: 'presenter-notes-writer',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use('/__presenter-notes', async (req, res) => {
        const reply = (status, message) => {
          res.statusCode = status;
          res.end(message);
        };
        if (req.method !== 'PUT') return reply(405, 'PUT only');
        if (!LOOPBACK_ADDRESSES.has(req.socket.remoteAddress)) return reply(403, 'Notes can only be saved from this machine');

        const url = new URL(req.url, 'http://localhost');
        const slideId = url.pathname.replace(/^\//, '');
        const step = Number(url.searchParams.get('step') ?? 0);
        const slideDir = join(presentation.dir, 'slides', slideId);
        if (!SLIDE_ID_PATTERN.test(slideId) || !existsSync(slideDir)) return reply(404, 'Unknown slide');
        if (!Number.isInteger(step) || step < 0) return reply(400, 'Invalid step');

        const fileName = notesFileName(readdirSync(slideDir), step);
        const filePath = join(slideDir, fileName);
        justWritten.add(normalizePath(filePath));
        writeFileSync(filePath, await readBody(req), 'utf-8');
        return reply(200, `${slideId}/${fileName}`);
      });
    },

    handleHotUpdate({ file }) {
      if (justWritten.delete(normalizePath(file))) return [];
      return undefined;
    },
  };
}
