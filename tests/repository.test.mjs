import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(path) {
  return readFileSync(join(ROOT, path), 'utf-8').replaceAll('\r\n', '\n');
}

/** Markdown text without fenced code blocks, whose links are examples. */
function prose(path) {
  return readFileSync(path, 'utf-8').replace(/```[\s\S]*?```/g, '');
}

function filesUnder(dir, pattern) {
  const absolute = join(ROOT, dir);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { recursive: true })
    .map((name) => join(absolute, name))
    .filter((path) => statSync(path).isFile() && pattern.test(path));
}

/** `## ` sections by heading, plus `preamble` without its first paragraph (which names the other file). */
function agentSections(path) {
  const [preamble, ...rest] = read(path).split(/\n(?=## )/);
  const sections = { preamble: preamble.split('\n\n').slice(2).join('\n\n').trim() };
  for (const section of rest) {
    const heading = section.slice(3, section.indexOf('\n'));
    sections[heading] = section.trim();
  }
  return sections;
}

describe('agent files', () => {
  it('CLAUDE.md and AGENTS.md share every section except the cold-start one', () => {
    const claude = agentSections('CLAUDE.md');
    const agents = agentSections('AGENTS.md');
    assert.deepEqual(Object.keys(agents).filter((heading) => heading !== 'Operating in this repository'), Object.keys(claude));
    for (const heading of Object.keys(claude)) {
      assert.equal(agents[heading], claude[heading], `section "${heading}" differs between CLAUDE.md and AGENTS.md`);
    }
  });
});

describe('documentation', () => {
  it('reaches every document under docs/ from docs/index.md', () => {
    const docsDir = join(ROOT, 'docs');
    const seen = new Set();
    const queue = [join(docsDir, 'index.md')];
    while (queue.length > 0) {
      const path = queue.shift();
      if (seen.has(path) || !existsSync(path)) continue;
      seen.add(path);
      for (const [, target] of prose(path).matchAll(/\]\(([^)#\s]+\.md)(#[^)]*)?\)/g)) {
        const linked = normalize(join(dirname(path), target));
        if (linked.startsWith(docsDir)) queue.push(linked);
      }
    }
    const unreachable = filesUnder('docs', /\.md$/).filter((path) => !seen.has(path));
    assert.deepEqual(unreachable.map((path) => relative(ROOT, path)), []);
  });

  it('has no dead relative links in markdown', () => {
    const markdown = [
      ...filesUnder('docs', /\.md$/),
      ...['README.md', 'CLAUDE.md', 'AGENTS.md', 'DATA.md'].map((name) => join(ROOT, name)),
    ];
    const dead = [];
    for (const path of markdown) {
      for (const [, target] of prose(path).matchAll(/\]\(((?!https?:)[^)#\s]+)(#[^)]*)?\)/g)) {
        if (!existsSync(join(dirname(path), target))) dead.push(`${relative(ROOT, path)} → ${target}`);
      }
    }
    assert.deepEqual(dead, []);
  });
});

describe('presentations', () => {
  const presentationsDir = join(ROOT, 'presentations');
  // A directory holding only the ignored public/ and assets/ is media left in
  // the checkout by another branch, not a presentation.
  const ids = readdirSync(presentationsDir).filter((name) => {
    const dir = join(presentationsDir, name);
    return statSync(dir).isDirectory() && readdirSync(dir).some((entry) => !['public', 'assets'].includes(entry));
  });

  it('are data plus layouts, without build files of their own', () => {
    for (const id of ids) {
      for (const required of ['presentation.json', 'layouts/index.js']) {
        assert.ok(existsSync(join(presentationsDir, id, required)), `presentations/${id}/${required} is missing`);
      }
      for (const forbidden of ['package.json', 'vite.config.js', 'index.html', 'main.jsx', 'App.jsx']) {
        assert.ok(!existsSync(join(presentationsDir, id, forbidden)), `presentations/${id}/${forbidden} duplicates the framework`);
      }
    }
  });

  it('lay out slides for the fixed stage, without viewport media queries', () => {
    const offenders = [...filesUnder('core/client/layouts', /\.css$/), ...filesUnder('presentations', /layouts.*\.css$/)]
      .filter((path) => /@media\s*\([^)]*width/.test(readFileSync(path, 'utf-8')));
    assert.deepEqual(offenders.map((path) => relative(ROOT, path)), []);
  });

  it('import the framework through @core, never through old paths', () => {
    const offenders = filesUnder('presentations', /\.(js|jsx)$/)
      .filter((path) => /from ['"](@app\/|.*packages\/core|.*core\/client)/.test(readFileSync(path, 'utf-8')));
    assert.deepEqual(offenders.map((path) => relative(ROOT, path)), []);
  });
});
