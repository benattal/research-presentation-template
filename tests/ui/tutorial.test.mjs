/**
 * The tutorial deck in a browser: every slide and build step loads without
 * an error, and every task slide shows its task with a state. The states
 * themselves are not asserted: a reader's working copy has tasks done.
 * `tests/tutorial.test.mjs` covers what makes a task done.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { selectPresentations } from '../../core/tooling/presentations.js';
import { launchBrowser, newContext, newPage, startLocal } from './harness.mjs';

const [tutorial] = selectPresentations(['./tutorial']);
const slideIds = tutorial.manifest.sections.flatMap((section) => section.slides);

function contentOf(slideId) {
  return JSON.parse(readFileSync(join(tutorial.dir, 'slides', slideId, 'content.json'), 'utf-8'));
}

describe('the tutorial deck', { timeout: 240000 }, () => {
  let server;
  let browser;
  let page;

  before(async () => {
    server = await startLocal(tutorial);
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
      const content = contentOf(slideId);
      const steps = content.buildSteps?.length ?? 1;
      await page.locator('.nav-dot').nth(index).click();
      await page.waitForSelector(`.slide[data-slide-id="${slideId}"]`);
      for (let step = 1; step < steps; step += 1) await page.keyboard.press('ArrowRight');
      if (content.layout === 'task') {
        const panel = page.locator('.task-panel');
        assert.equal(await panel.count(), 1, `${slideId}: one task panel`);
        assert.match(await panel.getAttribute('class'), /task-panel--(manual|todo|done)/, `${slideId}: a state`);
        assert.match(await page.locator('.task-file').innerText(), /^tutorial\//, `${slideId}: the file to open`);
        assert.ok((await page.locator('.task-instruction').innerText()).length > 20, `${slideId}: the task`);
      }
    }
    assert.deepEqual(page.errors, []);
  });

  it('has a task panel that stays inside the stage at every task', async () => {
    for (const [index, slideId] of slideIds.entries()) {
      if (contentOf(slideId).layout !== 'task') continue;
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
