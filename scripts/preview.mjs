#!/usr/bin/env node
/**
 * Serve a static build (dist/<id>/, from npm run build) on this machine,
 * to check it before presenting from it.
 *
 *   npm run preview [-- <id>] [--port 4173] [--host]
 *
 * `--host` listens on the network as well as on this machine, to open the
 * build on a tablet or phone. Only the build is served.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { preview } from 'vite';
import { STATIC_BUILD_DIR, selectOnePresentation } from '../core/tooling/presentations.js';
import { createViteConfig } from '../core/tooling/viteConfig.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: 'string', default: '4173' },
    host: { type: 'boolean', default: false },
  },
});

const presentation = selectOnePresentation(positionals[0]);
const outDir = join(STATIC_BUILD_DIR, presentation.id);
if (!existsSync(join(outDir, 'index.html'))) {
  console.error(`${outDir} has no build. Run "npm run build -- ${presentation.id}" first.`);
  process.exit(1);
}

const server = await preview({
  ...createViteConfig({ presentation, base: './', live: false, outDir }),
  preview: { port: Number(values.port), host: values.host ? '0.0.0.0' : 'localhost' },
});
server.printUrls();
