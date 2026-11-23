import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { CLIENT_DIR, REPO_ROOT, commandNameOf, directoryOf } from './presentations.js';
import { notesWriter } from './notesWriter.js';

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

/** Put the presentation's title in `index.html`. */
function presentationTitle(presentation) {
  return {
    name: 'presentation-title',
    transformIndexHtml: (html) => html.replace('%PRESENTATION_TITLE%', escapeHtml(presentation.manifest.title ?? presentation.id)),
  };
}

/**
 * What the development server may read from disk for `presentation`
 * (Vite's `server.fs`): the client, the presentation's own directory, and
 * the installed packages. Vite's default refusals are repeated because
 * setting `deny` replaces them; the last entry adds a presentation's
 * `assets/`, the source material its slides were made from, which no slide
 * loads.
 */
function servedFiles(presentation) {
  return {
    allow: [CLIENT_DIR, presentation.dir, join(REPO_ROOT, 'node_modules')],
    deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/presentations/*/assets/**'],
  };
}

/**
 * The Vite configuration for one presentation. Every script that runs Vite
 * (dev, build, the gateway, capture, check) builds its configuration here.
 *
 * The shared client in `core/client/` is the Vite root; the alias
 * `@presentation` points at `presentations/<id>/` and `@core` at the
 * client, so a presentation's own layouts import the framework as
 * `@core/...`. `public/` of the presentation is Vite's public directory.
 *
 * The development server hands out only what a deck is made of
 * (`servedFiles`): with `--host` it is reachable by every device on the
 * network, and the rest of the checkout (plans, trackers, another
 * presentation, a presentation's source material) is not the deck.
 *
 * @param {object} args
 * @param {{ id: string, dir: string, manifest: object }} args.presentation
 * @param {string} args.base     URL prefix: '/' for local development, './' for
 *                               static builds, '/<id>/' behind the gateway
 * @param {boolean} args.live    whether the live gateway serves this build
 *                               (enables presenter login, polls, following)
 * @param {string} [args.outDir] build output directory
 * @param {object} [args.server] Vite `server` options to merge in
 */
export function createViteConfig({ presentation, base, live, outDir, server = {} }) {
  return {
    configFile: false,
    root: CLIENT_DIR,
    base,
    publicDir: join(presentation.dir, 'public'),
    cacheDir: join(REPO_ROOT, 'node_modules/.vite', presentation.id),
    plugins: [react(), presentationTitle(presentation), notesWriter(presentation)],
    resolve: {
      alias: {
        '@core': CLIENT_DIR,
        '@presentation': presentation.dir,
      },
    },
    define: {
      __LIVE_SERVER__: JSON.stringify(live),
      __PRESENTATION_ID__: JSON.stringify(presentation.id),
      __PRESENTATION_COMMAND_NAME__: JSON.stringify(commandNameOf(presentation)),
      __PRESENTATION_DIR__: JSON.stringify(directoryOf(presentation)),
    },
    server: {
      ...server,
      fs: servedFiles(presentation),
    },
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: true,
    },
  };
}
