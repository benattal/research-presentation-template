/**
 * Shared setup for the browser tests in tests/ui/: servers for a fixture
 * presentation in either hosting mode, a browser, and error collection.
 *
 * The browser is Playwright's Chromium unless UI_TEST_BROWSER names an
 * installed channel (`msedge`, `chrome`).
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { createGateway } from '../../core/server/gateway.js';
import { REPO_ROOT } from '../../core/tooling/presentations.js';
import { createViteConfig } from '../../core/tooling/viteConfig.js';

export const PRESENTER_PASSWORD = 'ui-test-password';

/** A presentation from tests/fixtures/, shaped like `listPresentations()` entries. */
export function fixture(name) {
  const dir = join(REPO_ROOT, 'tests/fixtures', name);
  return { id: name, dir, manifest: JSON.parse(readFileSync(join(dir, 'presentation.json'), 'utf-8')) };
}

/**
 * A presentation of `count` content slides, in sections of ten, written to a
 * temporary directory: for what only a long deck shows, such as a row of
 * navigation dots wider than the window.
 */
export function longDeck(count) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-long-deck-'));
  const ids = Array.from({ length: count }, (_, index) => `slide-${index + 1}`);
  for (const id of ids) {
    mkdirSync(join(dir, 'slides', id), { recursive: true });
    writeFileSync(join(dir, 'slides', id, 'content.json'), JSON.stringify({ layout: 'content', title: id, bullets: ['A point'] }));
  }
  mkdirSync(join(dir, 'layouts'));
  writeFileSync(join(dir, 'layouts', 'index.js'), 'export default {};\n');
  const sections = [];
  for (let start = 0; start < count; start += 10) {
    const number = start / 10 + 1;
    sections.push({ id: `part-${number}`, title: `Part ${number}`, slides: ids.slice(start, start + 10) });
  }
  const manifest = { title: 'Long deck', sections };
  writeFileSync(join(dir, 'presentation.json'), JSON.stringify(manifest));
  return { id: 'long-deck', dir, manifest };
}

/** Local mode: a Vite development server for one presentation, on a free port. */
export async function startLocal(presentation) {
  const config = createViteConfig({ presentation, base: '/', live: false, server: { port: 0, host: '127.0.0.1' } });
  // The configuration serves files from the repository only; a generated
  // presentation (`longDeck`) lives in a temporary directory outside it.
  config.server.fs.allow.push(presentation.dir);
  const server = await createServer({ ...config, logLevel: 'error' });
  await server.listen();
  return { url: server.resolvedUrls.local[0], close: () => server.close() };
}

/**
 * Live mode: the gateway in development for `presentations`, on a free port.
 * `settings` is the object the server reads on every request; change its
 * fields to switch voting or follow-the-presenter, then reload the pages.
 */
export async function startLive(presentations, settings = { votingOpen: true, presenterControlled: false }) {
  const { app, close } = await createGateway({
    presentations,
    mode: 'development',
    presenterPassword: PRESENTER_PASSWORD,
    settings,
    stateDir: mkdtempSync(join(tmpdir(), 'ui-live-state-')),
  });
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    settings,
    close: async () => {
      await close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

export async function launchBrowser() {
  const channel = process.env.UI_TEST_BROWSER;
  try {
    return await chromium.launch(channel ? { channel } : {});
  } catch (error) {
    throw new Error(
      `Could not start the test browser (${channel ?? 'Playwright Chromium'}). Run `
      + '"npx playwright install chromium", or set UI_TEST_BROWSER=msedge or chrome.\n'
      + error.message,
    );
  }
}

/** A 1280×720 page whose uncaught exceptions and console errors land in `page.errors`. */
export async function newPage(context) {
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (error) => page.errors.push(`exception: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') page.errors.push(`console: ${message.text()}`);
  });
  return page;
}

export function newContext(browser, options = {}) {
  return browser.newContext({ viewport: { width: 1280, height: 720 }, ...options });
}

/** Slide ids of the ui-showcase fixture, in presentation order. */
export const SHOWCASE_SLIDES = fixture('ui-showcase').manifest.sections.flatMap((section) => section.slides);

/** 1-based position of a ui-showcase slide, as the slide counter shows it. */
export function slideNumber(slideId) {
  const index = SHOWCASE_SLIDES.indexOf(slideId);
  if (index === -1) throw new Error(`No slide "${slideId}" in the ui-showcase fixture`);
  return index + 1;
}

/** The audience counter while `slideId` is shown, e.g. "4 / 16". */
export function counterText(slideId) {
  return `${slideNumber(slideId)} / ${SHOWCASE_SLIDES.length}`;
}

/** The audience view's slide counter, e.g. "4 / 16". */
export async function counter(page) {
  return (await page.locator('.nav-slide-counter').innerText()).replace(/\s+/g, ' ').trim();
}

/**
 * Jump the audience view to a ui-showcase slide by clicking its navigation
 * dot, and wait until it has replaced the previous slide: a slide change
 * plays the old slide's exit before the new slide mounts.
 */
export async function goToSlide(page, slideId) {
  await page.locator('.nav-dot').nth(slideNumber(slideId) - 1).click();
  await page.waitForSelector(`.slide[data-slide-id="${slideId}"]`);
}
