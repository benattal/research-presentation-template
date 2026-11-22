/**
 * The audience view in local mode: keyboard, buttons, dots, the overview,
 * swipes, focus handling, position persistence, and the toolbar; the stage
 * and slide headings holding still from slide to slide; and its layout at
 * every window size, where the stage and the bars share the window without
 * overlapping.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import { REPO_ROOT } from '../../core/tooling/presentations.js';
import {
  SHOWCASE_SLIDES, TOUCH_DEVICES, counter, counterText, fixture, goToSlide, launchBrowser, longDeck, newContext, newPage,
  slideNumber, startLocal,
} from './harness.mjs';

const FIRST = SHOWCASE_SLIDES[0];
const SECOND = SHOWCASE_SLIDES[1];
const THIRD = SHOWCASE_SLIDES[2];
const LAST = SHOWCASE_SLIDES.at(-1);

/** Every slide and build step of the ui-showcase fixture, in order: `{ id, step }`. */
const POSITIONS = SHOWCASE_SLIDES.flatMap((id) => {
  const content = JSON.parse(readFileSync(join(fixture('ui-showcase').dir, 'slides', id, 'content.json'), 'utf-8'));
  return Array.from({ length: content.buildSteps?.length ?? 1 }, (_, step) => ({ id, step }));
});

/** True once one slide is on the stage, fully faded in, with no animation running. Runs in the page. */
function slideSettled() {
  const slides = document.querySelectorAll('.slide');
  return slides.length === 1 && getComputedStyle(slides[0]).opacity === '1'
    && document.getAnimations().every((animation) => animation.playState !== 'running');
}

/**
 * Window-pixel boxes of the stage, the slide's first heading, and, for a
 * `SlideTitle` header, its title and subtitle measured from the header's
 * top. Runs in the page.
 */
function measureSlide() {
  const box = (element) => {
    if (!element) return null;
    const { left, top, width, height } = element.getBoundingClientRect();
    return { left, top, width, height };
  };
  const slide = document.querySelector('.slide');
  const header = slide.querySelector('.slide-header');
  const fromHeader = (element) => {
    if (!element) return null;
    const { top, height } = element.getBoundingClientRect();
    return { top: top - header.getBoundingClientRect().top, height };
  };
  return {
    stage: box(document.querySelector('.slide-stage')),
    heading: box(slide.querySelector('h1, h2')),
    header: header && { title: fromHeader(header.querySelector('.slide-title')), subtitle: fromHeader(header.querySelector('.slide-subtitle')) },
  };
}

/** Assert that two boxes (objects of numbers) agree to half a window pixel. */
function assertSameBox(actual, expected, message) {
  for (const [key, value] of Object.entries(expected)) {
    assert.ok(Math.abs(actual[key] - value) <= 0.5, `${message}: ${key} ${actual[key]} != ${value}`);
  }
}

/**
 * Dispatch a drag of `fingers` fingers starting on `selector`, travelling
 * `dx` pixels sideways and `dy` down. The events carry plain touch lists:
 * WebKit outside iOS does not let a page construct a `Touch`.
 */
function swipe(page, selector, dx, { dy = 0, fingers = 1 } = {}) {
  return page.evaluate(({ selector: target, dx: travelX, dy: travelY, fingers: count }) => {
    const element = document.querySelector(target);
    const touchEvent = (type, touches, changedTouches) => Object.assign(new Event(type, { bubbles: true }), { touches, changedTouches });
    const down = Array.from({ length: count }, (_, finger) => ({ identifier: finger, clientX: 640 + 40 * finger, clientY: 300 }));
    element.dispatchEvent(touchEvent('touchstart', down, down));
    element.dispatchEvent(touchEvent('touchend', [], [{ identifier: 0, clientX: 640 + travelX, clientY: 300 + travelY }]));
  }, { selector, dx, dy, fingers });
}

/**
 * Swipe left starting on an element made from `html` and put on the page
 * for the swipe; a slide's own media come and go with the slide. `inner`
 * selects the element under the finger when it is not the outermost one.
 */
async function swipeOn(page, html, inner = '') {
  await page.evaluate((markup) => {
    const holder = document.createElement('div');
    holder.id = 'swipe-target';
    holder.innerHTML = markup;
    document.body.append(holder);
  }, html);
  await swipe(page, `#swipe-target > * ${inner}`, -200);
  await page.evaluate(() => document.getElementById('swipe-target').remove());
}

/**
 * The actions the keyboard has (`KEY_ACTIONS` in useKeyboardNavigation.js),
 * read from the source so that a new key without a touch path fails here.
 */
const KEY_ACTION_NAMES = [...new Set(
  [...readFileSync(join(REPO_ROOT, 'core/client/navigation/useKeyboardNavigation.js'), 'utf-8')
    .match(/const KEY_ACTIONS = \{([^}]*)\}/)[1]
    .matchAll(/: '(\w+)'/g)].map((match) => match[1]),
)];

/** Resetting a poll stays a key: only the presenter does it, at a keyboard (live.test.mjs). */
const KEYBOARD_ONLY_ACTIONS = ['resetPoll'];

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
    await swipe(page, '.slide', -200, { dy: 300 });
    assert.equal(await counter(page), counterText(FIRST), 'a drag that goes farther down than sideways');
    await swipe(page, '.slide', -200, { fingers: 2 });
    assert.equal(await counter(page), counterText(FIRST), 'a pinch');
    await goToSlide(page, 'poll');
    await swipe(page, '.poll-option', -200);
    assert.equal(await counter(page), counterText('poll'), 'a drag on a control is not a swipe');
  });

  it('follows swipes that start on media, except media that take drags', async () => {
    const taken = [
      ['a video with controls', '<video controls></video>'],
      ['a canvas a layout marked', '<canvas data-no-swipe></canvas>'],
      ['a drawing inside a marked box', '<div data-no-swipe><svg><circle r="5"></circle></svg></div>', 'circle'],
    ];
    for (const [name, html, inner] of taken) {
      await swipeOn(page, html, inner);
      assert.equal(await counter(page), counterText(FIRST), `${name} keeps the drag`);
    }
    const shown = [
      ['an image', '<img alt="">'],
      ['a video without controls', '<video></video>'],
      ['a canvas', '<canvas></canvas>'],
      ['a shape in an SVG', '<svg><circle r="5"></circle></svg>', 'circle'],
    ];
    for (const [name, html, inner] of shown) {
      await swipeOn(page, html, inner);
      assert.equal(await counter(page), counterText(SECOND), `a swipe on ${name} moves on`);
      await page.keyboard.press('ArrowLeft');
      assert.equal(await counter(page), counterText(FIRST));
    }
  });

  it('does by touch everything the keys do', async () => {
    const overview = page.locator('.slide-overview');
    const touchPaths = {
      next: async () => {
        await page.tap('.nav-btn[aria-label="Next slide"]');
        assert.equal(await counter(page), counterText(SECOND));
      },
      previous: async () => {
        await page.tap('.nav-btn[aria-label="Previous slide"]');
        assert.equal(await counter(page), counterText(FIRST));
      },
      toggleOverview: async () => {
        await page.tap('.nav-end');
        await page.locator('.overview-card').nth(slideNumber('discussion') - 1).tap();
        assert.equal(await overview.count(), 0);
        assert.equal(await counter(page), counterText('discussion'));
      },
      closeOverview: async () => {
        await page.tap('.nav-end');
        assert.equal(await overview.count(), 1);
        await page.tap('.overview-close');
        assert.equal(await overview.count(), 0);
      },
      toggleFullscreen: async () => {
        await page.tap('.toolbar-btn[title^="Fullscreen"]');
        await page.waitForFunction(() => document.fullscreenElement !== null);
        await page.evaluate(() => document.exitFullscreen());
        await page.waitForFunction(() => document.fullscreenElement === null);
      },
      openPresenterWindow: async () => {
        const [popup] = await Promise.all([context.waitForEvent('page'), page.tap('.toolbar-btn[title^="Open presenter"]')]);
        assert.match(popup.url(), /\?mode=presenter$/);
        await popup.close();
      },
    };
    assert.deepEqual(
      Object.keys(touchPaths).sort(),
      KEY_ACTION_NAMES.filter((name) => !KEYBOARD_ONLY_ACTIONS.includes(name)).sort(),
      'every action of a key has a touch path here',
    );
    for (const act of Object.values(touchPaths)) await act();
    assert.deepEqual(page.errors, []);
  });

  it('shows the toolbar at rest where nothing can hover, and on hover elsewhere', async () => {
    const opacity = (target) => target.$eval('.toolbar-buttons', (toolbar) => getComputedStyle(toolbar).opacity);
    assert.equal(await opacity(page), '1', 'a touch screen');
    const desktop = await newContext(browser);
    const mousePage = await newPage(desktop);
    await mousePage.goto(server.url);
    await mousePage.waitForSelector('.slide');
    assert.equal(await opacity(mousePage), '0', 'a mouse that is elsewhere');
    await desktop.close();
  });

  it('offers no fullscreen where the browser has none', async () => {
    const without = await newContext(browser, { hasTouch: true });
    await without.addInitScript(() => {
      Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false });
    });
    const bare = await newPage(without);
    await bare.goto(server.url);
    await bare.waitForSelector('.slide');
    assert.equal(await bare.locator('.toolbar-btn[title*="ullscreen"]').count(), 0);
    assert.equal(await bare.locator('.toolbar-btn[title^="Open presenter"]').count(), 1, 'the rest of the toolbar is there');
    await bare.keyboard.press('f');
    assert.equal(await bare.evaluate(() => document.fullscreenElement), null);
    assert.deepEqual(bare.errors, []);
    await without.close();
  });

  it('names the slide and build step in the bar with ?review, and not without', async () => {
    assert.equal(await page.locator('.nav-review-id, .nav-review-step').count(), 0);
    await page.goto(`${server.url}?review`);
    await page.waitForSelector('.slide');
    await goToSlide(page, 'progressive');
    const label = async () => [
      await page.locator('.nav-review-id').innerText(), await page.locator('.nav-review-step').innerText(),
    ];
    assert.deepEqual(await label(), ['progressive', 'step 1/3']);
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await label(), ['progressive', 'step 2/3']);
    assert.equal(await counter(page), counterText('progressive'));
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

  // A stage that rescales, or a heading that moves, jumps when the presenter
  // advances. Every SlideTitle header has the same title height and subtitle
  // offset: math in a title and a layout's own heading styles must not
  // change them.
  it('keeps the stage and each slide heading in place across slides and build steps', async () => {
    const measured = [];
    for (const [index, position] of POSITIONS.entries()) {
      if (index > 0) await page.keyboard.press('ArrowRight');
      await page.waitForSelector(`.slide[data-slide-id="${position.id}"]`);
      await page.waitForFunction(slideSettled);
      measured.push({ ...position, ...await page.evaluate(measureSlide) });
    }
    const [first] = measured;
    const headers = measured.filter((entry) => entry.header);
    assert.ok(headers.length >= 2 && headers.every((entry) => entry.header.subtitle), 'the fixture has two headers with subtitles');
    for (const [index, entry] of measured.entries()) {
      const frame = `${entry.id} step ${entry.step + 1}`;
      assertSameBox(entry.stage, first.stage, `${frame}: the stage`);
      const previous = measured[index - 1];
      if (previous?.id === entry.id) assertSameBox(entry.heading, previous.heading, `${frame}: the heading`);
      if (entry.header) {
        assertSameBox(entry.header.title, headers[0].header.title, `${frame}: the title`);
        assertSameBox(entry.header.subtitle, headers[0].header.subtitle, `${frame}: the subtitle`);
      }
    }
    assert.deepEqual(page.errors, []);
  });

  it('advances the progress bar', async () => {
    const width = () => page.$eval('.progress-bar', (bar) => bar.getBoundingClientRect().width);
    assert.equal(await width(), 0);
    await goToSlide(page, LAST);
    await page.waitForFunction(() => document.querySelector('.progress-bar').getBoundingClientRect().width > 1270);
  });

  it('shows the stage alone with ?bars=hidden, still moving with the keys, and says when its slides are ready', async () => {
    await page.goto(`${server.url}?bars=hidden`);
    await page.waitForSelector('.slide');
    assert.equal(await page.locator('.navigation, .progress-track').count(), 0);
    const stage = await page.$eval('.slide-stage', (element) => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    });
    assert.deepEqual(stage, { left: 0, top: 0, right: 1280, bottom: 720 });
    await page.waitForSelector('body[data-slides-ready="true"]');
    await page.keyboard.press('ArrowRight');
    await page.waitForSelector(`.slide[data-slide-id="${SECOND}"]`);
    assert.deepEqual(page.errors, []);
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
    counter: find('.nav-slide-counter'),
    chrome: [...document.querySelectorAll('.toolbar-btn, .nav-btn, .nav-dots, .nav-end, .nav-slide-counter, .nav-review-id')]
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
  await page.setViewportSize({ width, height });
  await checkLayout(page);
}

/** Check the stage and the chrome at the window's size; `where` names the case in a failure. */
async function checkLayout(page, where = '') {
  const fits = await page.waitForFunction(stageFitsTheFreeSpace, null, { timeout: 3000 }).then(() => true, () => false);
  const layout = await page.evaluate(measureLayout);
  const { width, height } = layout;
  const size = `${where}${width}×${height}`;
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
  assert.ok(layout.counter, `${size}: the slide counter shows`);
  assert.ok(!overlaps(layout.counter, layout.controls), `${size}: the counter clears the controls`);
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

  async function open(url, device) {
    await context?.close();
    context = await (device ? browser.newContext(device) : newContext(browser));
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

    // The same on a tablet and a phone as the browser describes them (touch,
    // no hover, a coarse pointer), plain and with the review label, which
    // is the widest the end of the bar gets.
    it(`fits a tablet and a phone held both ways: ${name}`, async () => {
      const slideCount = presentation.manifest.sections.flatMap((section) => section.slides).length;
      for (const [deviceName, device] of Object.entries(TOUCH_DEVICES)) {
        for (const query of ['', '?review']) {
          const page = await open(`${servers[name].url}${query}`, device);
          const dots = page.locator('.nav-dot');
          if (await dots.first().isVisible()) await dots.nth(Math.floor(slideCount / 2)).tap();
          await checkLayout(page, `${deviceName} ${query} `);
          assert.deepEqual(page.errors, [], deviceName);
        }
      }
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
