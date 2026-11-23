/* global __PRESENTATION_DIR__ */
import { Fragment, useEffect, useRef, useState } from 'react';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { taskState } from './taskChecks.js';
import './TaskSlide.css';

/** This presentation's directory, from the repository root: what a reader types into an editor (`core/tooling/viteConfig.js` sets it). */
const DECK = __PRESENTATION_DIR__;

/** Files that belong to one slide; any other `file` is the deck's own (`presentation.json`, `theme.css`). */
const SLIDE_FILES = ['content.json', 'notes.md'];

/** What the panel's badge says in each state of `taskState`. */
const STATE_LABELS = {
  manual: 'Try it',
  todo: 'To do',
  done: 'Done',
};

/**
 * The places a task names, written out for the slide `slideId`. A task's
 * text says `@folder` for the slide's directory, `@public` for where its
 * media go, and `@media` for the path a `content.json` names them by, so
 * that no slide of this deck spells out a media path of a file that is
 * not there (`npm run check` reads every such path as a file to find).
 */
function placesOf(slideId) {
  return {
    '@folder': `${DECK}/slides/${slideId}`,
    '@public': `${DECK}/public/slides/${slideId}`,
    '@media': `/slides/${slideId}`,
  };
}

function withPlaces(text, places) {
  return Object.entries(places).reduce((result, [token, place]) => result.replaceAll(token, place), text);
}

/** `children` with a place to break the line after each slash. */
function Path({ children }) {
  return children.split('/').map((segment, index, segments) => (
    <Fragment key={index}>{segment}{index < segments.length - 1 && <>/<wbr /></>}</Fragment>
  ));
}

/**
 * A line of this layout's text. What stands between two backticks is shown
 * as code (a file's name, a field's name); the rest goes through `Text`,
 * which renders math. Code stays on one line, except that a path may
 * continue on the next line after a slash. The other core layouts print a backtick as it is.
 */
function Inline({ children }) {
  return children.split('`').map((part, index) => (
    index % 2 === 1 ? <code key={index} className="task-code"><Path>{part}</Path></code> : <Text key={index}>{part}</Text>
  ));
}

/**
 * Whether the picture at `src` loads: `null` while it is being fetched,
 * then `true` or `false`. A `media` entry that names a file which is not
 * in `public/` must not count as a picture added.
 */
function usePictureLoads(src) {
  const [loads, setLoads] = useState(null);
  useEffect(() => {
    if (!src) return undefined;
    let current = true;
    const probe = new Image();
    probe.onload = () => { if (current) setLoads(true); };
    probe.onerror = () => { if (current) setLoads(false); };
    probe.src = src;
    return () => {
      current = false;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [src]);
  return src ? loads : null;
}

/** How long the copy button says that it copied, in milliseconds. */
const COPIED_MS = 1500;

/**
 * What to say to a coding agent, set apart so that it can be read whole or
 * copied. The copy button shows only where the browser lets a page write
 * to the clipboard (localhost and https; not a plain-http address on the
 * network).
 */
function Prompt({ text }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div className="task-prompt">
      <div className="task-prompt-head">
        <span className="task-prompt-label">Say to your agent</span>
        {navigator.clipboard && (
          <button type="button" className="task-prompt-copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
        )}
      </div>
      <p className="task-prompt-text">{text}</p>
    </div>
  );
}

/**
 * A slide that asks the reader to change this presentation, and shows when
 * they have. On the left is the slide being edited: its `title` and
 * `subtitle`, its `bullets`, its `media`, and the `secondStep` line that
 * only a second build step shows. On the right is the task: `task` (what
 * to do), `file` (the file to open: `content.json` or `notes.md` of this
 * slide, or a file of the deck by its path in the deck, such as
 * `presentation.json`), `snippet` (the text to find, paste, or run; a
 * task of commands has a snippet and no file), `ask` (what to say to a
 * coding agent that does the task instead), and `whenDone` (shown once the
 * task is done). A task that takes two files gives `files`, a list of
 * `{ file, snippet }`, in place of `file` and `snippet`. A task that is
 * done by asking gives `prompt`: the words to say to a coding agent, shown
 * whole with a button that copies them. `task`, snippets, and `whenDone`
 * may use the places of `placesOf`.
 *
 * The state comes from `check` (see `taskChecks.js`) and so from the
 * deck's own data: saving the edit reloads the page, and the slide reads
 * what the deck now is. A picture counts only once it loads. A slide without a
 * `check` shows "Try it" and never says "Done".
 */
export default function TaskSlide({ slide, buildStep, sections, slides }) {
  const places = placesOf(slide.id);
  const picture = slide.media?.[0];
  const pictureLoads = usePictureLoads(picture?.type === 'image' ? picture.src : undefined);
  const dataState = taskState(slide, sections, slides);
  const state = dataState === 'done' && pictureLoads === false ? 'todo' : dataState;
  const stepCount = slide.buildSteps?.length ?? 1;
  // What to open and what to put there: one pair, or `files` when a task
  // takes two files, so that each text sits under the file it belongs in.
  const edits = slide.files ?? [{ file: slide.file, snippet: slide.snippet }];
  const pathOf = (file) => (SLIDE_FILES.includes(file) ? `${places['@folder']}/${file}` : `${DECK}/${file}`);

  return (
    <div className="slide--task">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />

      <div className="task-columns">
        <div className="task-result">
          {slide.bullets && (
            <ul className="task-bullets">
              {slide.bullets.map((bullet, index) => (
                <li key={index}><Inline>{bullet}</Inline></li>
              ))}
            </ul>
          )}
          {picture && pictureLoads !== false && <Media item={picture} className="task-picture" />}
          {picture && pictureLoads === false && (
            <p className="task-missing">
              The slide names a picture, and no file is there yet. Put it in <code>{places['@public']}</code>,
              then reload this page.
            </p>
          )}
          {slide.secondStep && stepCount > 1 && (
            <p className="task-second-step" style={{ opacity: buildStep >= 1 ? 1 : 0 }}>
              <Inline>{slide.secondStep}</Inline>
            </p>
          )}
          {stepCount > 1 && <p className="task-step-count">Step {buildStep + 1} of {stepCount}</p>}
        </div>

        <aside className={`task-panel task-panel--${state}`}>
          <div className="task-state">{STATE_LABELS[state]}</div>
          <p className="task-instruction"><Inline>{withPlaces(slide.task, places)}</Inline></p>
          {edits.map((edit, index) => (
            <div key={index} className="task-edit">
              {edit.file && <code className="task-file">{pathOf(edit.file)}</code>}
              {edit.snippet && <pre className="task-snippet">{withPlaces(edit.snippet, places)}</pre>}
            </div>
          ))}
          {slide.prompt && <Prompt text={slide.prompt} />}
          {slide.ask && state !== 'done' && (
            <p className="task-ask"><span className="task-ask-label">Or ask an agent:</span> “{slide.ask}”</p>
          )}
          {state === 'done' && slide.whenDone && (
            <p className="task-when-done"><Inline>{withPlaces(slide.whenDone, places)}</Inline></p>
          )}
        </aside>
      </div>
    </div>
  );
}
