/**
 * What a presenter sees when something is wrong, and the static build:
 * a presentation with errors lists every problem, an unknown mode says so,
 * and a static build works from any URL prefix.
 */
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import express from 'express';
import { build } from 'vite';
import { createViteConfig } from '../../core/tooling/viteConfig.js';
import { SHOWCASE_SLIDES, fixture, launchBrowser, newContext, newPage, startLocal } from './harness.mjs';

describe('errors and hosting', { timeout: 240000 }, () => {
  let browser;
  const closers = [];

  before(async () => {
    browser = await launchBrowser();
  });

  after(async () => {
    await browser?.close();
    for (const close of closers) await close();
  });

  it('lists every problem of a presentation that does not load', async () => {
    const server = await startLocal(fixture('broken'));
    closers.push(server.close);
    const page = await newPage(await newContext(browser));
    await page.goto(server.url);
    await page.waitForSelector('[data-load-error]');
    const problems = await page.locator('.load-error li').allInnerTexts();
    assert.equal(problems.length, 2);
    assert.match(problems.join('\n'), /"noSuchLayout"/);
    assert.match(problems.join('\n'), /"missing"/);
    assert.match(await page.locator('.load-error').innerText(), /npm run check/);
  });

  it('names the valid modes for an unknown one', async () => {
    const server = await startLocal(fixture('ui-showcase'));
    closers.push(server.close);
    const page = await newPage(await newContext(browser));
    await page.goto(`${server.url}?mode=bogus`);
    assert.match(await page.locator('.load-error').innerText(), /Unknown mode .bogus.[\s\S]*audience, presenter, preview, capture/);
  });

  it('serves a static build under any URL prefix, with its media', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'ui-static-build-'));
    await build({
      ...createViteConfig({ presentation: fixture('ui-showcase'), base: './', live: false, outDir }),
      logLevel: 'error',
    });
    const app = express();
    app.use('/talks/2026/showcase', express.static(outDir));
    const server = await new Promise((resolve) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    closers.push(() => new Promise((resolve) => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}/talks/2026/showcase/`;

    const page = await newPage(await newContext(browser));
    await page.goto(url);
    await page.waitForSelector('.slide[data-slide-id="title"]');
    assert.equal(await page.locator('.nav-slide-counter').innerText(), `1 / ${SHOWCASE_SLIDES.length}`);

    await page.goto(`${url}?mode=capture&slide=5&step=0`);
    await page.waitForSelector('body[data-capture-ready="true"]');
    const report = await page.evaluate(() => window.__captureReport);
    assert.equal(report.slide, 'media');
    assert.deepEqual(report.mediaProblems, []);
    assert.equal(await page.$$eval('.media-grid-item img', (images) => images.filter((image) => image.naturalWidth > 0).length), 4);
    assert.deepEqual(page.errors, []);
  });
});
