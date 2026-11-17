/**
 * Every core layout, rendered by the capture view at every build step of
 * the ui-showcase fixture: what each layout must show, and no errors,
 * missing media, or overflow anywhere. And the capture view's overflow
 * report itself, on the overflow fixture's slides that do not fit.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { REPO_ROOT } from '../../core/tooling/presentations.js';
import { fixture, launchBrowser, newContext, newPage, startLocal } from './harness.mjs';

const showcase = fixture('ui-showcase');

/** Layout names registered in core/client/layouts/index.js. */
function coreLayoutNames() {
  const registry = readFileSync(join(REPO_ROOT, 'core/client/layouts/index.js'), 'utf-8');
  const body = registry.slice(registry.indexOf('export default {'));
  return [...body.matchAll(/^\s+(\w+): \w+,$/gm)].map((match) => match[1]);
}

const count = (page, selector) => page.locator(selector).count();
const text = (page, selector) => page.locator(selector).first().innerText();
const loadedImages = (page, selector = '.slide img') => page.$$eval(selector, (images) => images.filter((image) => image.naturalWidth > 0).length);

/** What each fixture slide must show at a given 0-based step. */
const EXPECTATIONS = {
  async title(page) {
    assert.equal(await text(page, '.slide--title h1'), 'UI Showcase');
    assert.equal(await text(page, '.slide--title .subtitle'), 'Every core layout');
    assert.match(await page.locator('.title-bg').getAttribute('style'), /\/slides\/title\/background\.svg/);
  },
  async outline(page) {
    assert.equal(await count(page, '.outline-item'), 3);
    assert.match(await text(page, '.outline-item--active'), /Live audience/);
    assert.equal(await count(page, '.outline-item--completed'), 1);
  },
  async content(page) {
    assert.equal(await count(page, '.bullet-item'), 3);
    assert.equal(await loadedImages(page), 1);
    assert.equal(await text(page, '.section-label'), 'STRUCTURE');
    assert.equal(await text(page, '.slide-footnote'), 'A footnote');
  },
  async progressive(page, step) {
    assert.equal(await count(page, '.build-step'), step + 1);
    assert.equal(await loadedImages(page), step === 2 ? 1 : 0);
  },
  async diagram(page) {
    assert.equal(await text(page, '.diagram-caption'), 'The figure');
    assert.equal(await count(page, '.prompt-box'), 2);
    assert.equal(await loadedImages(page), 1);
  },
  async media(page) {
    assert.equal(await count(page, '.media-grid-item'), 4);
    assert.equal(await loadedImages(page), 4);
    assert.equal(await text(page, '.slide-credits'), 'Doe et al., Conference 2020, Fig. 1');
  },
  async illustrated(page, step) {
    assert.equal(await count(page, '.ip-point'), step + 1);
    assert.equal(await count(page, '.ip-image-compare'), 1);
    assert.equal(await loadedImages(page, '.ip-image-compare img'), 2);
    assert.match(await text(page, '.ip-point-text'), /Compare images/);
    assert.equal(await count(page, '.ip-point-text strong'), 1);
    assert.equal(await count(page, '.ip-chat-compare'), step >= 1 ? 1 : 0);
    assert.equal(await count(page, '.ip-chat-conversation'), step >= 2 ? 1 : 0);
  },
  async discussion(page) {
    assert.equal(await count(page, '.discussion-prompt'), 3);
  },
  async colab(page) {
    assert.equal(await page.locator('a.colab-button').getAttribute('href'), 'https://colab.research.google.com/');
    assert.equal(await count(page, '.colab-qr svg'), 1);
    assert.equal(await count(page, '.colab-step'), 2);
    assert.equal(await page.locator('.colab-step a').getAttribute('href'), 'https://example.com/');
    assert.equal(await text(page, '.colab-note'), 'A note');
  },
  async 'colab-empty'(page) {
    assert.match(await text(page, '.colab-button--disabled'), /Coming Soon/);
    assert.equal(await count(page, '.colab-qr'), 0);
  },
  async links(page) {
    assert.deepEqual(await page.$$eval('.links-card', (cards) => cards.map((card) => card.getAttribute('href'))), ['../a/', '../b/']);
    assert.equal(await count(page, '.links-qr svg'), 1);
    assert.equal(await text(page, '.links-qr a'), 'example.com');
  },
  async poll(page) {
    assert.equal(await count(page, '.poll-option'), 3);
    assert.equal(await count(page, '.poll-option:disabled'), 3, 'local mode has no voting');
    assert.match(await text(page, '.poll-status'), /Local mode/);
  },
  async 'poll-results'(page) {
    assert.equal(await count(page, '.poll-result-row'), 3);
    assert.equal(await text(page, '.poll-total'), '0 votes');
  },
  async 'numeric-poll'(page) {
    assert.equal(await count(page, 'input.np-input:disabled'), 1);
    assert.match(await text(page, '.np-status'), /Local mode/);
  },
  async credits(page) {
    assert.equal(await count(page, '.credits-item'), 1);
    assert.match(await text(page, '.credits-item'), /^Doe et al\. A borrowed figure\. Conference 2020$/);
  },
  async 'step-counter'(page, step) {
    assert.equal(await text(page, '.step-counter'), `Step ${step + 1} of 2`);
  },
  async closing(page) {
    assert.equal(await text(page, '.slide--title h1'), 'The end');
  },
};

describe('core layouts', { timeout: 180000 }, () => {
  let server;
  let browser;
  let page;
  let slides;

  before(async () => {
    server = await startLocal(showcase);
    browser = await launchBrowser();
    page = await newPage(await newContext(browser));
    await page.goto(`${server.url}?mode=capture&slide=0&step=0`);
    await page.waitForSelector('body[data-capture-ready="true"]');
    slides = await page.evaluate(() => window.__presentationIndex);
  });

  after(async () => {
    await browser?.close();
    await server?.close();
  });

  it('the fixture uses every core layout', () => {
    const used = new Set(slides.map((slide) => slide.layout));
    assert.deepEqual(coreLayoutNames().filter((name) => !used.has(name)), []);
    assert.ok(coreLayoutNames().length >= 13);
  });

  it('every slide has an expectation', () => {
    assert.deepEqual(slides.map((slide) => slide.id).filter((id) => !EXPECTATIONS[id]), []);
  });

  it('renders every slide and step with its content, and without errors, missing media, or overflow', async () => {
    for (const [index, slide] of slides.entries()) {
      for (let step = 0; step < slide.steps; step += 1) {
        const frame = `${slide.id} step ${step + 1}`;
        page.errors.length = 0;
        await page.goto(`${server.url}?mode=capture&slide=${index}&step=${step}`);
        await page.waitForSelector('body[data-capture-ready="true"]');
        const report = await page.evaluate(() => window.__captureReport);
        assert.equal(report.slide, slide.id, frame);
        assert.deepEqual(page.errors, [], `${frame}: errors`);
        assert.deepEqual(report.mediaProblems, [], `${frame}: media`);
        assert.deepEqual(report.overflow, [], `${frame}: overflow`);
        await EXPECTATIONS[slide.id](page, step);
      }
    }
  });
});

describe('the overflow report', { timeout: 60000 }, () => {
  let server;
  let browser;
  let page;

  before(async () => {
    server = await startLocal(fixture('overflow'));
    browser = await launchBrowser();
    page = await newPage(await newContext(browser));
  });

  after(async () => {
    await browser?.close();
    await server?.close();
  });

  // The text's column keeps its width, so no element box reaches past the
  // column or the stage: only the text's own lines show the overflow.
  it('reports text that runs out of its column, inside the stage and past its edge', async () => {
    for (const [index, slideId] of ['formula-past-column', 'word-past-stage'].entries()) {
      await page.goto(`${server.url}?mode=capture&slide=${index}&step=0`);
      await page.waitForSelector('body[data-capture-ready="true"]');
      const report = await page.evaluate(() => window.__captureReport);
      assert.equal(report.slide, slideId);
      assert.deepEqual(
        report.overflow.map((finding) => `${finding.kind}: ${finding.element.split(' ')[0]}`),
        ['text-past-box: div.narrow-column-text'],
        slideId,
      );
    }
    assert.deepEqual(page.errors, []);
  });

  it('reports a title that runs onto a second line', async () => {
    await page.goto(`${server.url}?mode=capture&slide=2&step=0`);
    await page.waitForSelector('body[data-capture-ready="true"]');
    const report = await page.evaluate(() => window.__captureReport);
    assert.equal(report.slide, 'title-too-long');
    assert.deepEqual(report.overflow.map((finding) => `${finding.kind}: ${finding.element.split(' ')[0]}`), ['title-wraps: h2.slide-title']);
  });
});
