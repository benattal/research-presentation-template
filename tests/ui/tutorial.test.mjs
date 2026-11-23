/**
 * The two tutorial decks in a browser: every slide and build step loads
 * without an error, and every task slide shows its task with a state, and
 * a file to open, a text to use, or words to say. The states themselves
 * are not asserted: a reader's working copy has tasks done.
 * `tests/tutorial.test.mjs` covers what makes a task done. The second
 * tutorial has tasks on the live server, so the gateway must serve it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { selectPresentations } from '../../core/tooling/presentations.js';
import { launchBrowser, newContext, newPage, startLive, startLocal } from './harness.mjs';

const decks = selectPresentations(['tutorial', 'tutorial-agents']);

function contentOf(deck, slideId) {
  return JSON.parse(readFileSync(join(deck.dir, 'slides', slideId, 'content.json'), 'utf-8'));
}

for (const deck of decks) {
  const slideIds = deck.manifest.sections.flatMap((section) => section.slides);

  describe(`the deck ${deck.id}`, { timeout: 240000 }, () => {
    let server;
    let browser;
    let page;

    before(async () => {
      server = await startLocal(deck);
      browser = await launchBrowser();
      page = await newPage(await newContext(browser));
      await page.goto(server.url, { timeout: 120000 });
      await page.waitForSelector('.slide');
    });

    after(async () => {
      await browser?.close();
      await server?.close();
    });

    it('shows every slide and build step, each task with its panel, without an error', async () => {
      for (const [index, slideId] of slideIds.entries()) {
        const content = contentOf(deck, slideId);
        const steps = content.buildSteps?.length ?? 1;
        await page.locator('.nav-dot').nth(index).click();
        await page.waitForSelector(`.slide[data-slide-id="${slideId}"]`);
        for (let step = 1; step < steps; step += 1) await page.keyboard.press('ArrowRight');
        if (content.layout === 'task') {
          const panel = page.locator('.task-panel');
          assert.equal(await panel.count(), 1, `${slideId}: one task panel`);
          assert.match(await panel.getAttribute('class'), /task-panel--(manual|todo|done)/, `${slideId}: a state`);
          for (const file of await page.locator('.task-file').allInnerTexts()) {
            assert.ok(file.startsWith(`presentations/${deck.id}/`), `${slideId}: a file to open, from the repository's top folder`);
          }
          assert.ok(await page.locator('.task-file, .task-snippet, .task-prompt-text').count() > 0, `${slideId}: something to open, to run, or to say`);
          assert.ok((await page.locator('.task-instruction').innerText()).length > 20, `${slideId}: the task`);
        }
      }
      assert.deepEqual(page.errors, []);
    });

    it('has a task panel that stays inside the stage at every task', async () => {
      for (const [index, slideId] of slideIds.entries()) {
        if (contentOf(deck, slideId).layout !== 'task') continue;
        await page.locator('.nav-dot').nth(index).click();
        await page.waitForSelector(`.slide[data-slide-id="${slideId}"]`);
        const fits = await page.evaluate(() => {
          const stage = document.querySelector('.slide-stage').getBoundingClientRect();
          const panel = document.querySelector('.task-panel').getBoundingClientRect();
          return panel.left >= stage.left && panel.right <= stage.right && panel.top >= stage.top && panel.bottom <= stage.bottom;
        });
        assert.ok(fits, `${slideId}: the task panel is inside the stage`);
      }
    });
  });
}

describe('the second tutorial on the live server', { timeout: 120000 }, () => {
  let server;
  let browser;

  before(async () => {
    server = await startLive(decks.filter((deck) => deck.id === 'tutorial-agents'));
    browser = await launchBrowser();
  });

  after(async () => {
    await browser?.close();
    await server?.close();
  });

  it('is served at its own address, with a prompt that can be copied', async () => {
    const page = await newPage(await newContext(browser));
    await page.goto(`${server.url}/tutorial-agents/`, { timeout: 60000 });
    await page.waitForSelector('.slide[data-slide-id="welcome"]');
    await page.keyboard.press('ArrowRight');
    for (let step = 0; step < 4; step += 1) await page.keyboard.press('ArrowRight');
    await page.waitForSelector('.slide[data-slide-id="task-first"]');
    assert.match(await page.locator('.task-prompt-text').innerText(), /which skills/);
    assert.equal(await page.locator('.task-prompt-copy').innerText(), 'Copy');
    assert.deepEqual(page.errors, []);
  });
});
