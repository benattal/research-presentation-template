#!/usr/bin/env node
/**
 * Visual validation: render every slide and build step of a presentation
 * in a headless browser, screenshot it, and check it for problems.
 *
 *   npm run capture -- <id> [--slides id1,id2] [--scale 1] [--channel msedge]
 *                           [--compare <run-dir> | --no-compare] [--strict]
 *
 * Writes data/captures/<id>/<YYYYmmdd-HHMMSS>/ (ignored by git):
 *   <NN>-<slide-id>-<step>.png   the slide stage at 1280×720 × scale
 *   diff/                        changed pixels against the previous run
 *   report.json                  every frame's findings
 *   index.html                   contact sheet: open it to review the deck
 *
 * Findings per frame: console errors, uncaught exceptions, failed requests
 * (missing assets), images or videos that did not load (errors); content
 * that overflows the stage or is clipped (warnings); and the share of
 * pixels changed since the previous run. `--strict` exits with status 1
 * when any frame has an error or warning.
 *
 * The browser is Playwright's Chromium (`npx playwright install chromium`
 * once); `--channel msedge` or `--channel chrome` uses an installed browser
 * instead. See docs/implementation/visual-validation.md.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { createServer } from 'vite';
import { REPO_ROOT, selectOnePresentation } from '../core/tooling/presentations.js';
import { createViteConfig } from '../core/tooling/viteConfig.js';
import { writeContactSheet } from '../core/tooling/contactSheet.js';

/** Share of pixels that must differ before a frame counts as changed. */
const CHANGED_PIXEL_RATIO = 0.001;
const READY_TIMEOUT_MS = 30000;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    slides: { type: 'string' },
    scale: { type: 'string', default: '1' },
    channel: { type: 'string' },
    compare: { type: 'string' },
    'no-compare': { type: 'boolean', default: false },
    strict: { type: 'boolean', default: false },
  },
});

const presentation = selectOnePresentation(positionals[0]);
const runsDir = join(REPO_ROOT, 'data/captures', presentation.id);
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const runDir = join(runsDir, stamp);
const previousDir = values['no-compare'] ? null : (values.compare ?? latestRun(runsDir));
mkdirSync(join(runDir, 'diff'), { recursive: true });

function latestRun(dir) {
  if (!existsSync(dir)) return null;
  const runs = readdirSync(dir).filter((name) => existsSync(join(dir, name, 'report.json'))).sort();
  return runs.length > 0 ? join(dir, runs.at(-1)) : null;
}

function compareImages(currentPath, previousPath, diffPath) {
  if (!previousPath || !existsSync(previousPath)) return null;
  const current = PNG.sync.read(readFileSync(currentPath));
  const previous = PNG.sync.read(readFileSync(previousPath));
  if (current.width !== previous.width || current.height !== previous.height) {
    return { ratio: 1, note: 'size changed' };
  }
  const diff = new PNG({ width: current.width, height: current.height });
  const changed = pixelmatch(current.data, previous.data, diff.data, current.width, current.height, { threshold: 0.1 });
  const ratio = changed / (current.width * current.height);
  if (ratio < CHANGED_PIXEL_RATIO) return { ratio };
  writeFileSync(diffPath, PNG.sync.write(diff));
  return { ratio, diffFile: relative(runDir, diffPath).replaceAll('\\', '/') };
}

const server = await createServer(createViteConfig({
  presentation,
  base: '/',
  live: false,
  server: { port: 0, host: '127.0.0.1', hmr: false },
}));
await server.listen();
const baseUrl = server.resolvedUrls.local[0];

const browser = await chromium.launch(values.channel ? { channel: values.channel } : {});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: Number(values.scale),
});
const page = await context.newPage();

let log = null;
page.on('console', (message) => { if (message.type() === 'error') log?.consoleErrors.push(message.text()); });
page.on('pageerror', (error) => log?.pageErrors.push(String(error.stack ?? error)));
page.on('requestfailed', (request) => {
  const reason = request.failure()?.errorText;
  // Chromium aborts media range requests once it has buffered enough; a
  // video that really failed shows up in the page's media check instead.
  if (request.resourceType() === 'media' && reason === 'net::ERR_ABORTED') return;
  log?.failedRequests.push(`${request.url()} (${reason})`);
});
page.on('response', (response) => {
  if (response.status() >= 400) log?.failedRequests.push(`${response.url()} (HTTP ${response.status()})`);
});

async function open(slideIndex, step) {
  await page.goto(`${baseUrl}?mode=capture&slide=${slideIndex}&step=${step}`);
  await page.waitForSelector('body[data-capture-ready="true"], [data-load-error]', { timeout: READY_TIMEOUT_MS });
  return page.evaluate(() => ({
    loadError: document.querySelector('[data-load-error]')?.innerText ?? null,
    index: window.__presentationIndex ?? null,
    report: window.__captureReport ?? null,
  }));
}

const frames = [];
let exitCode = 0;
try {
  log = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  const first = await open(0, 0);
  if (first.loadError) {
    console.error(`The presentation did not load:\n${first.loadError}`);
    exitCode = 1;
  } else {
    const wanted = values.slides ? new Set(values.slides.split(',')) : null;
    for (const [slideIndex, slide] of first.index.entries()) {
      if (wanted && !wanted.has(slide.id)) continue;
      for (let step = 0; step < slide.steps; step += 1) {
        log = { consoleErrors: [], pageErrors: [], failedRequests: [] };
        let report = null;
        try {
          ({ report } = await open(slideIndex, step));
        } catch (error) {
          log.pageErrors.push(`capture timed out: ${error.message}`);
        }
        const file = `${String(slideIndex + 1).padStart(2, '0')}-${slide.id}-${step + 1}.png`;
        await page.locator('.slide-stage').screenshot({ path: join(runDir, file), animations: 'disabled' });

        const errors = [
          ...log.pageErrors,
          ...log.consoleErrors,
          ...log.failedRequests,
          ...(report?.mediaProblems ?? []),
        ];
        const warnings = (report?.overflow ?? []).map((finding) => `${finding.kind}: ${finding.element} (${finding.detail})`);
        const diff = previousDir ? compareImages(join(runDir, file), join(previousDir, file), join(runDir, 'diff', file)) : null;
        frames.push({
          file,
          slideIndex,
          slideId: slide.id,
          title: slide.title,
          layout: slide.layout,
          step: step + 1,
          steps: slide.steps,
          errors,
          warnings,
          diff,
        });
        const status = errors.length ? 'ERROR' : warnings.length ? 'warn ' : 'ok   ';
        console.log(`${status} ${file}${diff?.ratio >= CHANGED_PIXEL_RATIO ? `  changed ${(diff.ratio * 100).toFixed(1)}%` : ''}`);
      }
    }
  }
} finally {
  await browser.close();
  await server.close();
}

if (frames.length > 0) {
  const summary = {
    presentation: presentation.id,
    title: presentation.manifest.title,
    capturedAt: new Date().toISOString(),
    comparedWith: previousDir ? relative(REPO_ROOT, previousDir).replaceAll('\\', '/') : null,
    frames,
  };
  writeFileSync(join(runDir, 'report.json'), JSON.stringify(summary, null, 2));
  writeContactSheet(join(runDir, 'index.html'), summary, previousDir ? relative(runDir, previousDir).replaceAll('\\', '/') : null);

  const withErrors = frames.filter((frame) => frame.errors.length > 0).length;
  const withWarnings = frames.filter((frame) => frame.warnings.length > 0).length;
  const changed = frames.filter((frame) => frame.diff?.ratio >= CHANGED_PIXEL_RATIO).length;
  console.log(`\n${frames.length} frames: ${withErrors} with errors, ${withWarnings} with warnings`
    + `${previousDir ? `, ${changed} changed since ${relative(runsDir, previousDir)}` : ''}.`);
  console.log(`Contact sheet: ${join(runDir, 'index.html')}`);
  if (values.strict && (withErrors > 0 || withWarnings > 0)) exitCode = 1;
}
process.exit(exitCode);
