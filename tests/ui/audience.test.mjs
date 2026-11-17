/**
 * The audience view in local mode: keyboard, buttons, dots, the overview,
 * swipes, focus handling, position persistence, and the toolbar.
 */
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  SHOWCASE_SLIDES, counter, counterText, fixture, goToSlide, launchBrowser, newContext, newPage, slideNumber, startLocal,
} from './harness.mjs';

const FIRST = SHOWCASE_SLIDES[0];
const SECOND = SHOWCASE_SLIDES[1];
const THIRD = SHOWCASE_SLIDES[2];
const LAST = SHOWCASE_SLIDES.at(-1);

/** Dispatch a horizontal swipe starting on `selector`, travelling `dx` pixels. */
function swipe(page, selector, dx) {
  return page.evaluate(({ selector: target, dx: travel }) => {
    const element = document.querySelector(target);
    const touch = (x) => new Touch({ identifier: 1, target: element, clientX: x, clientY: 300 });
    element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [touch(640)], changedTouches: [touch(640)] }));
    element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [touch(640 + travel)] }));
  }, { selector, dx });
}

describe('audience view', { timeout: 180000 }, () => {
  let server;
  let browser;
  let context;
  let page;

  before(async () => {
    server = await startLocal(fixture('ui-showcase'));
    browser = await launchBrowser();
  });

  after(async () => {
    await browser?.close();
    await server?.close();
  });

  beforeEach(async () => {
    await context?.close();
    context = await newContext(browser, { hasTouch: true });
    page = await newPage(context);
    await page.goto(server.url);
    await page.waitForSelector('.slide');
  });

  it('starts on the first slide with previous disabled', async () => {
    assert.equal(await counter(page), counterText(FIRST));
    assert.ok(await page.locator('.nav-btn[aria-label="Previous slide"]').isDisabled());
    assert.equal(await page.title(), 'UI Showcase');
    assert.deepEqual(page.errors, []);
  });

  it('moves with every next and previous key', async () => {
    const moves = [['ArrowRight', SECOND], ['ArrowDown', THIRD], ['ArrowLeft', SECOND], ['Space', THIRD],
      ['Backspace', SECOND], ['Enter', THIRD], ['ArrowUp', SECOND], ['PageDown', THIRD], ['PageUp', SECOND]];
    for (const [key, slideId] of moves) {
      await page.keyboard.press(key);
      assert.equal(await counter(page), counterText(slideId), key);
    }
  });

  it('walks through build steps forward and lands on the last step going back', async () => {
    const afterProgressive = SHOWCASE_SLIDES[slideNumber('progressive')];
    await goToSlide(page, 'progressive');
    assert.equal(await page.locator('.build-step').count(), 1);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.build-step').count(), 3);
    assert.equal(await counter(page), counterText('progressive'), 'build steps do not change the slide');
    await page.keyboard.press('ArrowRight');
    assert.equal(await counter(page), counterText(afterProgressive));
    await page.keyboard.press('ArrowLeft');
    await page.waitForSelector('.slide[data-slide-id="progressive"]');
    assert.equal(await page.locator('.build-step').count(), 3, 'back onto the last step');
  });

  it('navigates with the buttons and dots, and stops at the end', async () => {
    await page.click('.nav-btn[aria-label="Next slide"]');
    assert.equal(await counter(page), counterText(SECOND));
    await page.click('.nav-btn[aria-label="Previous slide"]');
    assert.equal(await counter(page), counterText(FIRST));
    await goToSlide(page, 'step-counter');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.step-counter').innerText(), 'Step 2 of 2');
    await goToSlide(page, LAST);
    assert.ok(await page.locator('.nav-btn[aria-label="Next slide"]').isDisabled());
    await page.keyboard.press('ArrowRight');
    assert.equal(await counter(page), counterText(LAST), 'no move past the end');
  });

  it('opens the overview, jumps from it, and closes it with Escape', async () => {
    await page.keyboard.press('o');
    assert.equal(await page.locator('.overview-card').count(), SHOWCASE_SLIDES.length);
    await page.locator('.overview-card').nth(slideNumber('discussion') - 1).click();
    assert.equal(await page.locator('.slide-overview').count(), 0);
    assert.equal(await counter(page), counterText('discussion'));
    await page.keyboard.press('O');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.slide-overview').count(), 0);
  });

  it('follows swipes, except swipes that start on a control', async () => {
    await swipe(page, '.slide', -200);
    assert.equal(await counter(page), counterText(SECOND), 'swipe left = next');
    await swipe(page, '.slide', 200);
    assert.equal(await counter(page), counterText(FIRST), 'swipe right = previous');
    await swipe(page, '.slide', -20);
    assert.equal(await counter(page), counterText(FIRST), 'too short to count');
    await goToSlide(page, 'poll');
    await swipe(page, '.poll-option', -200);
    assert.equal(await counter(page), counterText('poll'), 'a drag on a control is not a swipe');
  });

  it('keeps arrow keys for the slides when a button or slider has focus, but not while typing', async () => {
    await page.locator('.nav-dot').nth(0).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await counter(page), counterText(SECOND));
    await page.evaluate(() => {
      for (const [type, id] of [['range', 'slider'], ['text', 'typing']]) {
        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        document.body.append(input);
      }
    });
    await page.focus('#slider');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await counter(page), counterText(FIRST), 'a focused slider does not swallow the clicker');
    await page.keyboard.press('ArrowRight');
    await page.focus('#typing');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type('o');
    assert.equal(await counter(page), counterText(SECOND));
    assert.equal(await page.locator('.slide-overview').count(), 0);
  });

  it('restores its position after a reload, under a key named after the presentation', async () => {
    await goToSlide(page, 'diagram');
    await page.reload();
    await page.waitForSelector('.slide');
    assert.equal(await counter(page), counterText('diagram'));
    const stored = await page.evaluate(() => sessionStorage.getItem('ui-showcase:slide-position'));
    assert.deepEqual(JSON.parse(stored), { index: slideNumber('diagram') - 1, step: 0 });
  });

  it('shows the toolbar: back link, fullscreen, presenter window', async () => {
    assert.equal(await page.locator('.toolbar-buttons a.toolbar-btn').getAttribute('href'), '../');
    await page.click('.toolbar-btn[title^="Fullscreen"]');
    const [popup] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('p')]);
    await popup.waitForLoadState();
    assert.match(popup.url(), /\?mode=presenter$/);
    assert.deepEqual(page.errors, []);
  });

  it('advances the progress bar', async () => {
    const width = () => page.$eval('.progress-bar', (bar) => bar.getBoundingClientRect().width);
    assert.equal(await width(), 0);
    await goToSlide(page, LAST);
    await page.waitForFunction(() => document.querySelector('.progress-bar').getBoundingClientRect().width > 1270);
  });
});
