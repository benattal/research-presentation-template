#!/usr/bin/env node
/**
 * Build presentations.
 *
 *   npm run build [-- <id>...]   static builds in dist/<id>/ (no live server;
 *                                open with npm run preview, or host the folder
 *                                on any static file server)
 *   npm run build:live           every presentation in dist/live/<id>/, for
 *                                the gateway (npm start)
 *
 * With no ids, every presentation is built.
 */
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { build } from 'vite';
import { LIVE_BUILD_DIR, STATIC_BUILD_DIR, selectPresentations } from '../core/tooling/presentations.js';
import { createViteConfig } from '../core/tooling/viteConfig.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { live: { type: 'boolean', default: false } },
});

for (const presentation of selectPresentations(positionals)) {
  const { id } = presentation;
  const outDir = values.live ? join(LIVE_BUILD_DIR, id) : join(STATIC_BUILD_DIR, id);
  console.log(`\nBuilding ${id} → ${outDir}`);
  await build(createViteConfig({
    presentation,
    base: values.live ? `/${id}/` : './',
    live: values.live,
    outDir,
  }));
}
