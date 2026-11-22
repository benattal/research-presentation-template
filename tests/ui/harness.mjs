/**
 * Shared setup for the browser tests in tests/ui/: servers for a fixture
 * presentation in either hosting mode, a browser, and error collection.
 *
 * The browser is Playwright's Chromium unless UI_TEST_BROWSER names an
 * installed channel (`msedge`, `chrome`) or `webkit`, Playwright's build of
 * Safari's engine.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, devices, webkit } from 'playwright';
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

/**
 * Request a presentation's page and every module it imports, once, and
 * return when all have been answered.
 *
 * A development server that has never served a presentation bundles its
 * dependencies on the first request, which takes seconds on a fast machine
 * and more than a test's 30-second page load on a slow one or in a fresh
 * clone. Asked for here, during a suite's setup, that one-time cost is
 * paid before any test's navigation starts its clock.
 */
async function warm(pageUrl) {
  const origin = new URL(pageUrl).origin;
  const html = await (await fetch(pageUrl)).text();
  const seen = new Set();
  const queue = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(([, src]) => new URL(src, pageUrl).pathname);
  while (queue.length > 0) {
    const batch = queue.splice(0).filter((path) => !seen.has(path));
    batch.forEach((path) => seen.add(path));
    const sources = await Promise.all(batch.map(async (path) => {
      const response = await fetch(origin + path);
      return response.ok ? response.text() : '';
    }));
    for (const source of sources) {
      for (const [, path] of source.matchAll(/(?:from|import)\s*\(?\s*"(\/[^"]+)"/g)) queue.push(path);
    }
  }
}

/** Local mode: a Vite development server for one presentation, on a free port, already warm. */
export async function startLocal(presentation) {
  const config = createViteConfig({ presentation, base: '/', live: false, server: { port: 0, host: '127.0.0.1' } });
  const server = await createServer({ ...config, logLevel: 'error' });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  await warm(url);
  return { url, close: () => server.close() };
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
  const url = `http://127.0.0.1:${server.address().port}`;
  for (const presentation of presentations) await warm(`${url}/${presentation.id}/`);
  return {
    url,
    settings,
    close: async () => {
      await close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

export async function launchBrowser() {
  const choice = process.env.UI_TEST_BROWSER;
  try {
    if (choice === 'webkit') return await webkit.launch();
    return await chromium.launch(choice ? { channel: choice } : {});
  } catch (error) {
    throw new Error(
      `Could not start the test browser (${choice ?? 'Playwright Chromium'}). Run `
      + `"npx playwright install ${choice === 'webkit' ? 'webkit' : 'chromium'}", or set UI_TEST_BROWSER=msedge or chrome.\n`
      + error.message,
    );
  }
}

/**
 * A tablet and a phone, as Playwright describes them (screen size, pixel
 * ratio, touch, a pointer that cannot hover), each held both ways. The
 * `defaultBrowserType` of a descriptor is left out: the browser is the one
 * `launchBrowser` started.
 */
export const TOUCH_DEVICES = Object.fromEntries(
  ['iPad (gen 7)', 'iPad (gen 7) landscape', 'iPhone 13', 'iPhone 13 landscape'].map((name) => {
    const { defaultBrowserType, ...descriptor } = devices[name];
    return [name, descriptor];
  }),
);

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
