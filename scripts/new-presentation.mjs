#!/usr/bin/env node
/**
 * Start a presentation: a title slide, an outline, one content slide, and a
 * closing slide, ready for `npm run dev -- <id>`.
 *
 *   npm run new -- <id> [--title "Talk title"]
 *
 * The id is the directory name under presentations/ (lowercase letters,
 * digits, hyphens) and the URL segment behind the live gateway.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { PRESENTATIONS_DIR } from '../core/tooling/presentations.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { title: { type: 'string' } },
});
const [id] = positionals;

if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error('Usage: npm run new -- <id> [--title "Talk title"]   (id: lowercase letters, digits, hyphens)');
  process.exit(1);
}
const dir = join(PRESENTATIONS_DIR, id);
if (existsSync(dir)) {
  console.error(`presentations/${id} already exists.`);
  process.exit(1);
}

const title = values.title ?? id.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

const files = {
  'presentation.json': json({
    title,
    defaultTransition: 'fade',
    sections: [
      { id: 'introduction', title: 'Introduction', slides: ['title', 'outline-introduction', 'motivation'] },
      { id: 'conclusion', title: 'Conclusion', slides: ['outline-conclusion', 'closing'] },
    ],
  }),
  'layouts/index.js': [
    '/**',
    ' * Layouts of this presentation, by the name slides use in `"layout"`.',
    ' * Core layouts (core/client/layouts/index.js) are available without being',
    ' * listed here; a name may not repeat a core one.',
    ' */',
    'export default {};',
    '',
  ].join('\n'),
  'slides/title/content.json': json({ layout: 'title', title, subtitle: 'Speaker name · Venue · Date' }),
  'slides/title/notes.md': 'Opening line.\n',
  'slides/outline-introduction/content.json': json({ layout: 'outline', activeSection: 'introduction' }),
  'slides/motivation/content.json': json({
    layout: 'content',
    sectionLabel: 'Introduction',
    title: 'Motivation',
    bullets: ['The problem', 'Why existing approaches fall short', 'What this talk shows'],
  }),
  'slides/motivation/notes.md': 'What the audience should take away from this slide.\n',
  'slides/outline-conclusion/content.json': json({ layout: 'outline', activeSection: 'conclusion' }),
  'slides/closing/content.json': json({ layout: 'title', title: 'Thank you', subtitle: 'Questions?' }),
};

for (const [path, content] of Object.entries(files)) {
  mkdirSync(join(dir, path, '..'), { recursive: true });
  writeFileSync(join(dir, path), content);
}

console.log(`Created presentations/${id}.`);
console.log(`  npm run dev -- ${id}       present it locally`);
console.log(`  npm run capture -- ${id}   screenshot and check every slide`);
