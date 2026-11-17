import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createLiveApi } from './liveApi.js';
import { createPresenterAuth } from './presenterAuth.js';
import { createViteConfig } from '../tooling/viteConfig.js';
import { LIVE_BUILD_DIR } from '../tooling/presentations.js';

/** First port of the per-presentation hot-reload sockets in development. */
const FIRST_HMR_PORT = 24678;

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

/** A plain list of the presentations, for a site without a `servedAtRoot` presentation. */
function presentationIndexPage(presentations) {
  const items = presentations
    .map(({ id, manifest }) => `<li><a href="/${id}/">${escapeHtml(manifest.title ?? id)}</a></li>`)
    .join('\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Presentations</title>
<style>body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#e8e8f0;max-width:40rem;margin:4rem auto;padding:0 1rem}a{color:#00d2ff}li{margin:.5rem 0}</style>
</head><body><h1>Presentations</h1><ul>${items}</ul></body></html>`;
}

/**
 * The live gateway: one Express app serving every presentation at
 * `/<id>/` with its live API at `/<id>/api/`.
 *
 * In development each presentation runs through its own Vite dev server in
 * middleware mode (hot reload, notes editing); in production the gateway
 * serves the builds in `dist/live/<id>/` from `npm run build:live`.
 *
 * `/` redirects to the presentation whose manifest sets
 * `"servedAtRoot": true` (at most one may), or lists all presentations.
 *
 * @param {object} args
 * @param {Array<{ id, dir, manifest }>} args.presentations
 * @param {'development' | 'production'} args.mode
 * @param {string} args.presenterPassword
 * @param {{ votingOpen: boolean, presenterControlled: boolean }} args.settings
 * @param {string} args.stateDir  directory for each presentation's poll state file
 * @returns {Promise<{ app, close: () => Promise<void> }>}
 */
export async function createGateway({ presentations, mode, presenterPassword, settings, stateDir }) {
  const rootPresentations = presentations.filter(({ manifest }) => manifest.servedAtRoot === true);
  if (rootPresentations.length > 1) {
    throw new Error(`Only one presentation may set "servedAtRoot": ${rootPresentations.map((p) => p.id).join(', ')}.`);
  }

  const app = express();
  const auth = createPresenterAuth(presenterPassword);
  const viteServers = [];

  app.use(express.json({ limit: '100kb' }));
  app.get('/health', (req, res) => res.json({ status: 'ok', presentations: presentations.map((p) => p.id) }));

  for (const [i, presentation] of presentations.entries()) {
    const { id } = presentation;
    app.use(`/${id}/api`, createLiveApi({ settings, auth, statePath: join(stateDir, `${id}.json`) }));

    // `/<id>` → `/<id>/`, so relative links in slide content resolve inside the presentation.
    app.use(`/${id}`, (req, res, next) => (req.originalUrl === `/${id}` ? res.redirect(301, `/${id}/`) : next()));

    if (mode === 'development') {
      const vite = await createViteServer(createViteConfig({
        presentation,
        base: `/${id}/`,
        live: true,
        server: { middlewareMode: true, hmr: { port: FIRST_HMR_PORT + i } },
      }));
      viteServers.push(vite);
      app.use(`/${id}`, vite.middlewares);
    } else {
      const buildDir = join(LIVE_BUILD_DIR, id);
      if (!existsSync(join(buildDir, 'index.html'))) {
        throw new Error(`${buildDir} has no build. Run "npm run build:live" first.`);
      }
      app.use(`/${id}`, express.static(buildDir));
    }
  }

  app.get('/', (req, res) => {
    if (rootPresentations.length === 1) return res.redirect(`/${rootPresentations[0].id}/`);
    return res.send(presentationIndexPage(presentations));
  });

  return {
    app,
    close: async () => {
      await Promise.all(viteServers.map((vite) => vite.close()));
    },
  };
}
