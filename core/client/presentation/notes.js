/**
 * Presenter notes: `slides/<slide-id>/notes.md`, or `notes-<step>.md` for
 * one build step (see `notesFileName`). Imported only by the presenter
 * window.
 */
import { indexNotes, notesFileName } from './model.js';

const noteFiles = import.meta.glob('@presentation/slides/*/notes*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const notesBySlide = indexNotes(noteFiles);

/** The notes text shown for a slide at a build step ('' when it has none). */
export function notesFor(slideId, step) {
  const files = notesBySlide[slideId] ?? {};
  return files[notesFileName(Object.keys(files), step)] ?? '';
}

/**
 * True when notes can be saved back to the presentation's files: only the
 * Vite development server has the writer (`core/tooling/notesWriter.js`).
 */
export const NOTES_WRITABLE = import.meta.env.DEV;

/**
 * Write a slide's notes for a build step to its notes file. The writer
 * picks the file with the same rule `notesFor` reads with. Resolves to
 * whether the file was written.
 */
export async function saveNotes(slideId, step, text) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}__presenter-notes/${slideId}?step=${step}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: text,
    });
    return response.ok;
  } catch {
    return false;
  }
}
