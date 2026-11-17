#!/usr/bin/env node
/**
 * Live mode: the Express gateway serving every presentation at /<id>/ with
 * presenter login, live polls, and follow-the-presenter.
 *
 *   npm run serve                development (Vite middleware, hot reload)
 *   npm start                    production (serves dist/live/, from npm run build:live)
 *
 * Configuration comes from the environment, or `.env` at the repository
 * root (see .env.example):
 *
 *   PRESENTER_PASSWORD=...       required
 *   PORT=3000
 *   VOTING_DISABLED=true         close voting on every poll
 *   PRESENTER_CONTROLLED=true    the audience follows the presenter's slide
 *   LIVE_STATE_DIR=.live-state   where poll votes are saved
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createGateway } from '../core/server/gateway.js';
import { REPO_ROOT, listPresentations } from '../core/tooling/presentations.js';

const { values } = parseArgs({
  options: { production: { type: 'boolean', default: false } },
});

const envFile = join(REPO_ROOT, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const presentations = listPresentations();
const mode = values.production ? 'production' : 'development';
const settings = {
  votingOpen: process.env.VOTING_DISABLED !== 'true',
  presenterControlled: process.env.PRESENTER_CONTROLLED === 'true',
};

const { app, close } = await createGateway({
  presentations,
  mode,
  presenterPassword: process.env.PRESENTER_PASSWORD,
  settings,
  stateDir: resolve(REPO_ROOT, process.env.LIVE_STATE_DIR ?? '.live-state'),
});

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => {
  console.log(`\nLive gateway (${mode}) on port ${port}`);
  console.log(`  voting ${settings.votingOpen ? 'open' : 'closed'}, presenter-controlled ${settings.presenterControlled ? 'on' : 'off'}`);
  for (const { id, manifest } of presentations) {
    console.log(`  http://localhost:${port}/${id}/  ${manifest.title}`);
  }
  console.log('');
});

async function shutdown() {
  await close();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
