import { useCallback, useEffect, useMemo, useState } from 'react';
import NotesMarkdown from './NotesMarkdown.jsx';
import { NOTES_WRITABLE, notesFor, saveNotes } from '../presentation/notes.js';
import { stepCount } from '../presentation/model.js';
import useKeyboardNavigation from '../navigation/useKeyboardNavigation.js';
import { LIVE_SERVER } from '../live/liveApi.js';
import { resetPoll } from '../live/polls.js';
import { usePresenterChannel } from './presenterChannel.js';
import { usePresenterAccess } from './presenterAccess.jsx';

function PresenterLogin() {
  const { login } = usePresenterAccess();
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const accepted = await login(password);
    setFailed(!accepted);
    if (!accepted) setPassword('');
  }

  return (
    <div className="presenter-view presenter-login">
      <form onSubmit={handleSubmit}>
        <h2>Presenter Mode</h2>
        <p>Enter the presenter password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoFocus
        />
        <button type="submit">Enter</button>
        {failed && <p className="presenter-login-error">Invalid password</p>}
      </form>
    </div>
  );
}

function useElapsedSeconds() {
  const [start] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [start]);
  return elapsed;
}

/**
 * Notes for the current slide and step, rendered as Markdown. Under the
 * development server they can be edited and saved back to the slide's
 * notes file; a saved edit is shown for the rest of the session.
 */
function NotesPanel({ slide, step }) {
  const [savedEdits, setSavedEdits] = useState({});
  const [draft, setDraft] = useState(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const key = `${slide.id}:${step}`;
  const notes = savedEdits[key] ?? notesFor(slide.id, step);

  useEffect(() => {
    setDraft(null);
    setSaveFailed(false);
  }, [key]);

  async function save() {
    const saved = await saveNotes(slide.id, step, draft);
    setSaveFailed(!saved);
    if (!saved) return;
    setSavedEdits((edits) => ({ ...edits, [key]: draft }));
    setDraft(null);
  }

  const editing = draft !== null;
  return (
    <div className="presenter-notes-col">
      <div className="presenter-notes-header">
        <h3>Notes</h3>
        {NOTES_WRITABLE && !editing && (
          <button className="presenter-edit-btn" onClick={() => setDraft(notes)}>Edit</button>
        )}
        {editing && (
          <div className="presenter-edit-actions">
            <button className="presenter-edit-btn presenter-edit-btn--save" onClick={save}>Save</button>
            <button className="presenter-edit-btn" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        )}
      </div>
      {saveFailed && <p className="presenter-login-error">Saving failed; the notes file was not changed.</p>}
      <div className="presenter-notes-content">
        {editing ? (
          <textarea
            className="presenter-notes-editor"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          />
        ) : (
          <NotesMarkdown>{notes || '*(No notes)*'}</NotesMarkdown>
        )}
      </div>
    </div>
  );
}

function PresenterConsole({ presentation }) {
  const { slides } = presentation;
  const { token, requiresLogin, logout } = usePresenterAccess();
  const [position, setPosition] = useState({ index: 0, step: 0 });
  const elapsed = useElapsedSeconds();
  const send = usePresenterChannel(setPosition);

  const slide = slides[position.index];
  const nextSlide = slides[position.index + 1];
  const steps = stepCount(slide);

  const keyActions = useMemo(() => {
    const actions = { next: () => send('next'), previous: () => send('previous') };
    if (LIVE_SERVER && slide.pollId) actions.resetPoll = () => resetPoll(slide.pollId, token);
    return actions;
  }, [send, slide, token]);
  useKeyboardNavigation(keyActions);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="presenter-view">
      <div className="presenter-header">
        <div className="presenter-timer">{minutes}:{seconds}</div>
        <div className="presenter-slide-info">
          Slide {position.index + 1} / {slides.length}
          {steps > 1 && <span className="presenter-build-info"> (step {position.step + 1}/{steps})</span>}
        </div>
        <div className="presenter-nav-buttons">
          <button onClick={() => send('previous')}>← Prev</button>
          <button onClick={() => send('next')}>Next →</button>
          {requiresLogin && <button onClick={logout} className="presenter-logout">Logout</button>}
        </div>
      </div>

      <div className="presenter-body">
        <div className="presenter-preview-col">
          <h3>Slide Preview</h3>
          <div className="presenter-mobile-frame">
            <iframe
              src={`${window.location.pathname}?mode=preview`}
              className="presenter-mobile-iframe"
              title="Current slide"
            />
          </div>
        </div>

        <NotesPanel slide={slide} step={position.step} />

        <div className="presenter-next-col">
          <h3>Up Next</h3>
          <div className="presenter-slide-preview presenter-slide-preview--next">
            {nextSlide ? (
              <>
                <div className="preview-section">{nextSlide.sectionTitle}</div>
                <div className="preview-title">{nextSlide.title || nextSlide.layout}</div>
              </>
            ) : (
              <div className="preview-title">End of presentation</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The presenter window (`?mode=presenter`, opened with the P key): a timer,
 * the current slide, its notes, and the next slide's title. It drives the
 * audience window in the same browser through `presenterChannel.js`; on a
 * live server it asks for the presenter password first.
 */
export default function PresenterView({ presentation }) {
  const { isPresenter } = usePresenterAccess();
  return isPresenter ? <PresenterConsole presentation={presentation} /> : <PresenterLogin />;
}
