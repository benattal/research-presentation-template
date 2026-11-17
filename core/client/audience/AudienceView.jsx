import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import useSlidePosition from '../navigation/useSlidePosition.js';
import useKeyboardNavigation from '../navigation/useKeyboardNavigation.js';
import useSwipeNavigation from '../navigation/useSwipeNavigation.js';
import useFollowPresenter from '../live/useFollowPresenter.js';
import { LIVE_SERVER, PRESENTATION_ID } from '../live/liveApi.js';
import { resetPoll } from '../live/polls.js';
import { useAudienceChannel } from '../presenter/presenterChannel.js';
import { usePresenterAccess } from '../presenter/presenterAccess.jsx';
import Stage from '../stage/Stage.jsx';
import SlideFrame from '../stage/SlideFrame.jsx';
import Navigation from './Navigation.jsx';
import ProgressBar from './ProgressBar.jsx';
import SlideOverview from './SlideOverview.jsx';
import useFullscreen from './useFullscreen.js';

function openPresenterWindow() {
  window.open(`${window.location.pathname}?mode=presenter`, `${PRESENTATION_ID}-presenter`, 'width=1100,height=700');
}

/**
 * The audience view: the current slide on the scaled stage, the progress
 * bar, the navigation bar, the toolbar, and the slide overview.
 *
 * Input comes from the keyboard (see `useKeyboardNavigation` for the keys),
 * swipes, the navigation bar, and the presenter window. While the live
 * server's follow-the-presenter mode is on, a non-presenter browser ignores
 * its own input and moves with the presenter instead.
 */
export default function AudienceView({ presentation }) {
  const navigation = useSlidePosition(presentation);
  const { isPresenter, token } = usePresenterAccess();
  const { following } = useFollowPresenter({
    position: navigation.position,
    setPosition: navigation.setPosition,
    isPresenter,
    token,
  });
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [showOverview, setShowOverview] = useState(false);

  const onPresenterCommand = useCallback((command) => {
    if (command === 'next') navigation.next();
    if (command === 'previous') navigation.previous();
  }, [navigation]);
  useAudienceChannel({ position: navigation.position, onCommand: onPresenterCommand });

  const keyActions = useMemo(() => {
    const actions = { toggleFullscreen, openPresenterWindow };
    if (!following) {
      Object.assign(actions, {
        next: navigation.next,
        previous: navigation.previous,
        toggleOverview: () => setShowOverview((shown) => !shown),
        closeOverview: () => setShowOverview(false),
      });
    }
    if (LIVE_SERVER && isPresenter && navigation.slide.pollId) {
      actions.resetPoll = () => resetPoll(navigation.slide.pollId, token);
    }
    return actions;
  }, [navigation, following, isPresenter, token, toggleFullscreen]);

  useKeyboardNavigation(keyActions);
  useSwipeNavigation({ next: navigation.next, previous: navigation.previous, enabled: !following });

  return (
    <div className="presentation">
      <ProgressBar current={navigation.position.index} total={presentation.slides.length} />

      <Stage>
        <AnimatePresence mode="wait">
          <SlideFrame
            key={navigation.position.index}
            presentation={presentation}
            slide={navigation.slide}
            buildStep={navigation.position.step}
            direction={navigation.direction}
          />
        </AnimatePresence>
      </Stage>

      {presentation.slides.length > 1 && (
      <Navigation
        slides={presentation.slides}
        position={navigation.position}
        isFirst={navigation.isFirst}
        isLast={navigation.isLast}
        next={navigation.next}
        previous={navigation.previous}
        goTo={navigation.goTo}
        disabled={following}
      />
      )}

      <div className="toolbar-buttons">
        {presentation.backLink && (
          <a className="toolbar-btn" href={presentation.backLink} title="Back">&#8592;</a>
        )}
        <button
          className="toolbar-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
        >
          &#x26F6;
        </button>
        <button className="toolbar-btn" onClick={openPresenterWindow} title="Open presenter notes (P)">
          &#x1F4CB;
        </button>
      </div>

      {showOverview && (
        <SlideOverview
          slides={presentation.slides}
          currentIndex={navigation.position.index}
          onSelect={(index) => {
            navigation.goTo(index);
            setShowOverview(false);
          }}
          onClose={() => setShowOverview(false)}
        />
      )}
    </div>
  );
}
