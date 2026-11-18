/**
 * The presenter window in local mode: it follows and drives the audience
 * window, shows each step's notes, previews the current slide, keeps time,
 * and saves edited notes to the notes files without reloading the audience.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  SHOWCASE_SLIDES, counter, counterText, fixture, goToSlide, launchBrowser, newContext, newPage, slideNumber, startLocal,
} from './harness.mjs';

const showcase = fixture('ui-showcase');
const NOTES_FILES = ['slides/title/notes.md', 'slides/progressive/notes-1.md'].map((path) => join(showcase.dir, path));

/** The presenter window's slide line for a slide, e.g. "Slide 4 / 16 (step 2/3)". */
function infoFor(slideId, step, steps) {
  const line = `Slide ${slideNumber(slideId)} / ${SHOWCASE_SLIDES.length}`;
  return steps ? `${line} (step ${step}/${steps})` : line;
}

describe('presenter window', { timeout: 180000 }, () => {
  const originals = new Map(NOTES_FILES.map((path) => [path, readFileSync(path, 'utf-8')]));
  let server;
  let browser;
  let audience;
  let presenter;

  const info = async () => (await presenter.locator('.presenter-slide-info').innerText()).replace(/\s+/g, ' ').trim();
  const notes = () => presenter.locator('.presenter-notes-content').innerText();
  const waitForInfo = (expected) => presenter.waitForFunction(
    (text) => document.querySelector('.presenter-slide-info')?.textContent.replace(/\s+/g, ' ').trim() === text,
    expected,
  );

  before(async () => {
    server = await startLocal(showcase);
    browser = await launchBrowser();
    const context = await newContext(browser);
    audience = await newPage(context);
    await audience.goto(server.url);
    await audience.waitForSelector('.slide');
    presenter = await newPage(context);
    await presenter.setViewportSize({ width: 1100, height: 700 });
    await presenter.goto(`${server.url}?mode=presenter`);
    await presenter.waitForSelector('.presenter-timer');
  });

  after(async () => {
    for (const [path, text] of originals) writeFileSync(path, text);
    await browser?.close();
    await server?.close();
  });

  it('opens without a login in local mode and shows the current slide', async () => {
    assert.equal(await info(), infoFor('title'));
    assert.equal(await presenter.locator('.presenter-logout').count(), 0);
    assert.match(await notes(), /Notes for the title slide\./);
    assert.equal(await presenter.locator('.presenter-notes-content strong').innerText(), 'title');
    // Math renders with KaTeX, inline and on its own lines, and no `$` delimiter is left as text.
    assert.equal(await presenter.locator('.presenter-notes-content span.math .katex').count(), 1);
    assert.equal(await presenter.locator('.presenter-notes-content div.math--display .katex-display').count(), 1);
    assert.doesNotMatch(await notes(), /\$/);
    assert.equal(await presenter.locator('.presenter-next-col .preview-title').innerText(), SHOWCASE_SLIDES[1]);
    await presenter.frameLocator('.presenter-mobile-iframe').locator('.slide[data-slide-id="title"]').waitFor();
  });

  it('drives the audience window with its buttons and keys', async () => {
    const [, second, third] = SHOWCASE_SLIDES;
    await presenter.click('text=Next →');
    await waitForInfo(infoFor(second));
    assert.equal(await counter(audience), counterText(second));
    await presenter.keyboard.press('ArrowRight');
    await waitForInfo(infoFor(third));
    assert.equal(await counter(audience), counterText(third));
    await presenter.click('text=← Prev');
    await waitForInfo(infoFor(second));
    await presenter.frameLocator('.presenter-mobile-iframe').locator(`.slide[data-slide-id="${second}"]`).waitFor();
  });

  it('follows the audience window and shows per-step notes', async () => {
    await goToSlide(audience, 'progressive');
    await waitForInfo(infoFor('progressive', 1, 3));
    assert.match(await notes(), /Shared notes for the progressive slide/);
    await audience.keyboard.press('ArrowRight');
    await waitForInfo(infoFor('progressive', 2, 3));
    assert.match(await notes(), /Notes for step two only/);
    await audience.keyboard.press('ArrowRight');
    await waitForInfo(infoFor('progressive', 3, 3));
    assert.match(await notes(), /Shared notes for the progressive slide/);
    await presenter.frameLocator('.presenter-mobile-iframe').locator('.build-step >> nth=2').waitFor();
  });

  it('keeps time', async () => {
    const before = await presenter.locator('.presenter-timer').innerText();
    await presenter.waitForTimeout(1200);
    assert.notEqual(await presenter.locator('.presenter-timer').innerText(), before);
    assert.match(before, /^\d\d:\d\d$/);
  });

  it('saves edited notes to the file that was shown, without reloading the audience view', async () => {
    await goToSlide(audience, 'title');
    await waitForInfo(infoFor('title'));
    await audience.evaluate(() => { window.__notReloaded = true; });

    await presenter.click('.presenter-edit-btn >> text=Edit');
    assert.match(await presenter.locator('.presenter-notes-editor').inputValue(), /Notes for the \*\*title\*\* slide/);
    await presenter.fill('.presenter-notes-editor', 'Edited by the UI test.');
    await presenter.click('text=Save');
    await presenter.waitForSelector('.presenter-notes-content >> text=Edited by the UI test.');
    assert.equal(readFileSync(NOTES_FILES[0], 'utf-8'), 'Edited by the UI test.');

    await presenter.click('.presenter-edit-btn >> text=Edit');
    await presenter.fill('.presenter-notes-editor', 'Discarded');
    await presenter.click('text=Cancel');
    assert.match(await notes(), /Edited by the UI test\./);
    assert.equal(readFileSync(NOTES_FILES[0], 'utf-8'), 'Edited by the UI test.');

    await goToSlide(audience, 'progressive');
    await audience.keyboard.press('ArrowRight');
    await waitForInfo(infoFor('progressive', 2, 3));
    await presenter.click('.presenter-edit-btn >> text=Edit');
    await presenter.fill('.presenter-notes-editor', 'Step two, edited.');
    await presenter.click('text=Save');
    await presenter.waitForSelector('.presenter-notes-content >> text=Step two, edited.');
    assert.equal(readFileSync(NOTES_FILES[1], 'utf-8'), 'Step two, edited.');

    await audience.waitForTimeout(1500);
    assert.equal(await audience.evaluate(() => window.__notReloaded), true, 'the audience view did not reload');
    assert.deepEqual(audience.errors, []);
    assert.deepEqual(presenter.errors, []);
  });
});
