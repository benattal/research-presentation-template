/**
 * The audience view in local mode: keyboard, buttons, dots, the overview,
 * swipes, focus handling, position persistence, and the toolbar; and its
 * layout at every window size, where the stage and the bars share the
 * window without overlapping.
 */
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  SHOWCASE_SLIDES, counter, counterText, fixture, goToSlide, launchBrowser, longDeck, newContext, newPage, slideNumber,
  startLocal,
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

/** Monitors, projectors, a laptop, a portrait tablet, and a phone held both ways. */
const WINDOW_SIZES = [
  [1920, 1080], [2560, 1440], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [800, 1200], [390, 844], [844, 390],
];

/** Window pixels by which boxes may overlap, stick out, or miss the center before it counts. */
const TOLERANCE_PX = 1;

/**
 * True once the stage has the largest size at which it fits between the
 * progress bar and the navigation bar (or the bottom of the window, while
 * the bar is hidden). Runs in the page.
 */
function stageFitsTheFreeSpace() {
  const stage = document.querySelector('.slide-stage')?.getBoundingClientRect();
  if (!stage) return false;
  const top = document.querySelector('.progress-bar').getBoundingClientRect().bottom;
  const bar = document.querySelector('.navigation');
  const bottom = bar && bar.getClientRects().length > 0 ? bar.getBoundingClientRect().top : window.innerHeight;
  const scale = Math.min(window.innerWidth / 1280, (bottom - top) / 720);
  return Math.abs(stage.width - 1280 * scale) <= 1 && Math.abs(stage.height - 720 * scale) <= 1;
}

/** The boxes of the stage and the chrome in window pixels, null for what is not displayed. Runs in the page. */
function measureLayout() {
  const box = (element) => {
    if (!element || element.getClientRects().length === 0) return null;
    const { left, top, right, bottom } = element.getBoundingClientRect();
    return { left, top, right, bottom };
  };
  const find = (selector) => box(document.querySelector(selector));
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    stage: find('.slide-stage'),
    progress: find('.progress-bar'),
    bar: find('.navigation'),
    controls: find('.nav-controls'),
    toolbar: find('.toolbar-buttons'),
    dots: find('.nav-dots'),
    activeDot: find('.nav-dot--active'),
    chrome: [...document.querySelectorAll('.toolbar-btn, .nav-btn, .nav-dots, .nav-slide-counter')]
      .map((element) => ({ name: element.className, box: box(element) }))
      .filter((entry) => entry.box),
  };
}

function overlaps(a, b) {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > TOLERANCE_PX
    && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > TOLERANCE_PX;
}

function inside(inner, outer) {
  return inner.left >= outer.left - TOLERANCE_PX && inner.top >= outer.top - TOLERANCE_PX
    && inner.right <= outer.right + TOLERANCE_PX && inner.bottom <= outer.bottom + TOLERANCE_PX;
}

/** Resize the window, then check the stage and the chrome at that size. */
async function checkLayoutAt(page, [width, height]) {
  const size = `${width}×${height}`;
  await page.setViewportSize({ width, height });
  const fits = await page.waitForFunction(stageFitsTheFreeSpace, null, { timeout: 3000 }).then(() => true, () => false);
  const layout = await page.evaluate(measureLayout);
  const windowBox = { left: 0, top: 0, right: width, bottom: height };

  assert.ok(fits, `${size}: the stage fills the space between the bars (stage ${JSON.stringify(layout.stage)})`);
  assert.ok(inside(layout.stage, windowBox), `${size}: the stage is inside the window`);
  for (const [name, chrome] of [['progress bar', layout.progress], ['navigation bar', layout.bar], ['toolbar', layout.toolbar]]) {
    assert.ok(!overlaps(layout.stage, chrome), `${size}: the stage clears the ${name}`);
  }
  const offset = (layout.controls.left + layout.controls.right) / 2 - width / 2;
  assert.ok(Math.abs(offset) <= TOLERANCE_PX, `${size}: the navigation controls are ${offset.toFixed(1)}px off center`);
  for (const { name, box } of layout.chrome) {
    assert.ok(inside(box, windowBox), `${size}: .${name} is inside the window (${JSON.stringify(box)})`);
  }
  if (layout.dots) {
    assert.ok(inside(layout.activeDot, layout.dots), `${size}: the current slide's dot is in view`);
  }
}

describe('audience layout at every window size', { timeout: 240000 }, () => {
  const decks = { 'ui-showcase': fixture('ui-showcase'), 'a 70-slide deck': longDeck(70) };
  const servers = {};
  let browser;
  let context;

  before(async () => {
    browser = await launchBrowser();
    for (const [name, presentation] of Object.entries(decks)) servers[name] = await startLocal(presentation);
  });

  after(async () => {
    await context?.close();
    await browser?.close();
    for (const server of Object.values(servers)) await server.close();
  });

  async function open(url) {
    await context?.close();
    context = await newContext(browser);
    const page = await newPage(context);
    await page.goto(url);
    await page.waitForSelector('.slide');
    return page;
  }

  for (const [name, presentation] of Object.entries(decks)) {
    it(`keeps the stage clear of the bars and the controls centered: ${name}`, async () => {
      const page = await open(servers[name].url);
      const slideCount = presentation.manifest.sections.flatMap((section) => section.slides).length;
      await page.locator('.nav-dot').nth(Math.floor(slideCount / 2)).click();
      for (const size of WINDOW_SIZES) await checkLayoutAt(page, size);
      assert.deepEqual(page.errors, []);
    });
  }

  it('gives the stage the whole height below the progress bar in fullscreen', async () => {
    const page = await open(servers['ui-showcase'].url);
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.fullscreenElement !== null);
    await page.waitForFunction(stageFitsTheFreeSpace);
    const layout = await page.evaluate(measureLayout);
    assert.equal(layout.bar, null, 'the navigation bar is hidden');
    assert.ok(Math.abs(layout.stage.bottom - layout.height) <= TOLERANCE_PX, 'the stage reaches the bottom of the window');
  });

  it('renders the capture and preview views at design size, without the bars', async () => {
    for (const mode of ['capture&slide=0&step=0', 'preview']) {
      const page = await open(`${servers['ui-showcase'].url}?mode=${mode}`);
      const layout = await page.evaluate(measureLayout);
      assert.deepEqual(layout.stage, { left: 0, top: 0, right: 1280, bottom: 720 }, mode);
      assert.equal(layout.bar, null, mode);
      assert.deepEqual(page.errors, [], mode);
    }
  });
});
