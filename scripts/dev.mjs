#!/usr/bin/env node
/**
 * Local mode: one presentation on a Vite development server, no live
 * server. Hot reload, the presenter window, and notes editing work; polls
 * show as offline.
 *
 *   npm run dev [-- <id>] [--port 5173] [--host]
 *
 * The id may be left out when the repository has one presentation.
 * `--host` listens on the network as well as on this machine.
 */
import { parseArgs } from 'node:util';
import { createServer } from 'vite';
import { selectOnePresentation } from '../core/tooling/presentations.js';
import { createViteConfig } from '../core/tooling/viteConfig.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: 'string', default: '5173' },
    host: { type: 'boolean', default: false },
  },
});

const presentation = selectOnePresentation(positionals[0]);
const server = await createServer(createViteConfig({
  presentation,
  base: '/',
  live: false,
  server: { port: Number(values.port), host: values.host ? '0.0.0.0' : 'localhost' },
}));
await server.listen();

console.log(`\n  ${presentation.manifest.title} (presentations/${presentation.id})`);
server.printUrls();
console.log('  Presenter window: press P, or add ?mode=presenter to the URL.\n');
