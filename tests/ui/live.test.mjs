/**
 * Live mode through the gateway: presenter login, choice and numeric polls
 * across several browsers, resets, closed voting, and follow-the-presenter.
 * Each browser context is one audience member.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import {
  PRESENTER_PASSWORD, counter, counterText, fixture, goToSlide, launchBrowser, newContext, newPage, startLive,
} from './harness.mjs';

describe('live mode', { timeout: 240000 }, () => {
  let live;
  let browser;
  let base;
  let presenterContext;
  let presenterView;
  const students = {};

  /** A new audience page in `context`, showing `slideId`. */
  async function openAt(context, slideId) {
    const page = await newPage(context);
    await page.goto(base);
    await page.waitForSelector('.slide');
    await goToSlide(page, slideId);
    return page;
  }

  const selected = (page) => page.locator('.poll-option--selected').count();
  const resultCounts = (page) => page.$$eval('.poll-result-count', (cells) => cells.map((cell) => Number(cell.textContent)));
  const waitForCounts = (page, expected) => page.waitForFunction(
    (want) => JSON.stringify([...document.querySelectorAll('.poll-result-count')].map((cell) => Number(cell.textContent))) === want,
    JSON.stringify(expected),
  );

  before(async () => {
    live = await startLive([fixture('ui-showcase')]);
    base = `${live.url}/ui-showcase/`;
    browser = await launchBrowser();
    presenterContext = await newContext(browser);
    for (const name of ['a', 'b', 'c']) students[name] = await newContext(browser);
  });

  after(async () => {
    await browser?.close();
    await live?.close();
  });

  it('lists the presentations at the root and redirects to the trailing slash', async () => {
    assert.match(await (await fetch(`${live.url}/`)).text(), /UI Showcase/);
    const redirect = await fetch(`${live.url}/ui-showcase`, { redirect: 'manual' });
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get('location'), '/ui-showcase/');
  });

  it('asks the presenter for the password, and logs out', async () => {
    const window = await newPage(presenterContext);
    await window.goto(`${base}?mode=presenter`);
    await window.fill('.presenter-login input', 'not the password');
    await window.click('.presenter-login button');
    await window.waitForSelector('.presenter-login-error');
    await window.fill('.presenter-login input', PRESENTER_PASSWORD);
    await window.click('.presenter-login button');
    await window.waitForSelector('.presenter-timer');
    await window.click('.presenter-logout');
    await window.waitForSelector('.presenter-login');
    await window.fill('.presenter-login input', PRESENTER_PASSWORD);
    await window.click('.presenter-login button');
    await window.waitForSelector('.presenter-timer');
    // The browser logs the 401 answer to the wrong password; nothing else may fail.
    assert.deepEqual(window.errors.filter((error) => !/status of 401/.test(error)), []);
    assert.equal(window.errors.length, 1);
  });

  it('records one vote per browser, changes it, and shows results live', async () => {
    const a = await openAt(students.a, 'poll');
    const b = await openAt(students.b, 'poll');
    const c = await openAt(students.c, 'poll-results');
    await a.waitForSelector('.poll-status--live');
    await c.waitForSelector('.poll-status--live');

    await a.locator('.poll-option').nth(0).click();
    await b.locator('.poll-option').nth(1).click();
    await a.locator('.poll-option').nth(2).click();
    await waitForCounts(c, [0, 1, 1]);
    assert.equal(await c.locator('.poll-total').innerText(), '2 votes');
    assert.equal(await selected(a), 1);
    assert.match(await a.locator('.poll-option--selected').innerText(), /Gamma/);

    await b.locator('.poll-option').nth(0).click();
    await waitForCounts(c, [1, 0, 1]);

    await a.reload();
    await goToSlide(a, 'poll');
    await a.waitForSelector('.poll-option--selected');
    assert.match(await a.locator('.poll-option--selected').innerText(), /Gamma/, 'the vote survives a reload');
    for (const page of [a, b, c]) assert.deepEqual(page.errors, []);
  });

  it('lets the presenter reset the poll with C', async () => {
    presenterView = await openAt(presenterContext, 'poll');
    const a = students.a.pages().at(-1);
    const c = students.c.pages().at(-1);
    await presenterView.keyboard.press('c');
    await a.waitForFunction(() => document.querySelectorAll('.poll-option--selected').length === 0);
    await waitForCounts(c, [0, 0, 0]);
    assert.equal(await c.locator('.poll-total').innerText(), '0 votes');
    assert.deepEqual(await resultCounts(c), [0, 0, 0]);
  });

  it('collects one number per browser in a numeric poll', async () => {
    const a = await openAt(students.a, 'numeric-poll');
    const b = await openAt(students.b, 'numeric-poll');
    await a.waitForSelector('.np-status--live');

    await a.fill('.np-input', '3');
    await a.click('.np-submit');
    await a.waitForSelector('.np-submitted-badge');
    await b.fill('.np-input', '5');
    await b.click('.np-submit');
    await a.fill('.np-input', '4');
    await a.click('.np-submit');
    await b.waitForFunction(() => document.querySelector('.np-total')?.textContent.startsWith('2 responses'));
    assert.deepEqual(await b.$$eval('.np-bar-label', (labels) => labels.map((label) => label.textContent)), ['4', '5']);
    assert.equal(await a.locator('.np-input').inputValue(), '4');
  });

  it('closes voting when the server says so', async () => {
    live.settings.votingOpen = false;
    try {
      const a = await openAt(students.a, 'poll');
      await a.waitForSelector('.poll-status--live');
      assert.match(await a.locator('.poll-status').innerText(), /voting closed/);
      assert.equal(await a.locator('.poll-option:disabled').count(), 3);
      const response = await fetch(`${base}api/poll/fixture-poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIndex: 0, voterId: 'outsider' }),
      });
      assert.equal(response.status, 403);
    } finally {
      live.settings.votingOpen = true;
    }
  });

  it('moves the audience with the presenter in presenter-controlled mode', async () => {
    live.settings.presenterControlled = true;
    try {
      const presenter = await openAt(presenterContext, 'title');
      const a = await openAt(students.a, 'title');
      assert.equal(await a.locator('.nav-btn').count(), 0, 'the audience cannot navigate');

      await goToSlide(presenter, 'content');
      await a.waitForSelector('.slide[data-slide-id="content"]');
      await a.keyboard.press('ArrowRight');
      await a.waitForTimeout(500);
      assert.equal(await counter(a), counterText('content'), 'own keys are ignored while following');

      await presenter.keyboard.press('ArrowRight');
      await a.waitForSelector('.slide[data-slide-id="progressive"]');
      await presenter.keyboard.press('ArrowRight');
      await a.waitForFunction(() => document.querySelectorAll('.build-step').length === 2);
      assert.deepEqual(a.errors, []);
    } finally {
      live.settings.presenterControlled = false;
    }
  });
});
