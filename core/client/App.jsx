import { lazy, Suspense } from 'react';
import AudienceView from './audience/AudienceView.jsx';
import CaptureView from './capture/CaptureView.jsx';
import PreviewView from './presenter/PreviewView.jsx';
import { PresenterAccessProvider } from './presenter/presenterAccess.jsx';

// The presenter window carries the Markdown renderer and every notes file;
// loading it on demand keeps both out of what audience devices download.
const PresenterView = lazy(() => import('./presenter/PresenterView.jsx'));

/**
 * The four views of one presentation, chosen by the `mode` query parameter:
 *
 *   (none)          audience view: the slides, full screen
 *   ?mode=presenter presenter window: notes, timer, preview, next slide
 *   ?mode=preview   the presenter window's live preview iframe
 *   ?mode=capture   one slide at design size for screenshots
 *                   (`&slide=<index>&step=<step>`, see scripts/capture.mjs)
 */
const VIEWS = {
  audience: AudienceView,
  presenter: PresenterView,
  preview: PreviewView,
  capture: CaptureView,
};

export default function App({ presentation }) {
  const mode = new URLSearchParams(window.location.search).get('mode') ?? 'audience';
  const View = VIEWS[mode];
  if (!View) {
    return (
      <div className="load-error">
        <h1>Unknown mode “{mode}”</h1>
        <p>Use one of: {Object.keys(VIEWS).join(', ')}.</p>
      </div>
    );
  }
  return (
    <PresenterAccessProvider>
      <Suspense fallback={null}>
        <View presentation={presentation} />
      </Suspense>
    </PresenterAccessProvider>
  );
}
