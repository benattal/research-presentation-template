#!/usr/bin/env node
/**
 * Local mode: one presentation on a Vite development server, no live
 * server. Hot reload, the presenter window, and notes editing work; polls
 * show as offline.
 *
 *   npm run dev [-- <id>] [--port 5173] [--host]
 *
 * The id may be left out when the repository has one presentation. A
 * presentation outside `presentations/` is named by its directory:
 * `npm run tutorial` is `npm run dev -- ./tutorial`.
 * `--host` listens on the network as well as on this machine, to review
 * the deck on a tablet or phone: every device on the network can then read
 * the slides and their notes, so use it on a network you trust.
 */
import { parseArgs } from 'node:util';
import { createServer } from 'vite';
import { commandNameOf, selectOnePresentation } from '../core/tooling/presentations.js';
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

console.log(`\n  ${presentation.manifest.title} (${commandNameOf(presentation)})`);
server.printUrls();
console.log('  Presenter window: press P, or add ?mode=presenter to the URL.');
for (const url of server.resolvedUrls.network) {
  console.log(`  Review on a tablet or phone, each slide's id and step in the bar: ${url}?review`);
}
console.log('');
