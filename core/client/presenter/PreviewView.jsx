import { useEffect, useState } from 'react';
import { clampPosition } from '../navigation/position.js';
import { preloadSlides } from '../presentation/preload.js';
import Stage from '../stage/Stage.jsx';
import SlideFrame from '../stage/SlideFrame.jsx';
import { usePresenterChannel } from './presenterChannel.js';

/**
 * The presenter window's preview iframe (`?mode=preview`): the slide the
 * audience window shows, on the same stage, following it through the
 * presenter channel. It renders without transitions and takes no input.
 *
 * It gets every slide ready ahead of time, as the audience view does
 * (`preloadSlides`). It shares the audience window's thread (a window that
 * a page opens runs with that page), so work the preview did on arriving at
 * a slide would hold up the audience window's next key press as well.
 */
export default function PreviewView({ presentation }) {
  const [position, setPosition] = useState({ index: 0, step: 0 });
  usePresenterChannel((received) => setPosition(clampPosition(presentation.slides, received)));
  useEffect(() => preloadSlides(presentation.slides, presentation.layouts), [presentation]);
  const slide = presentation.slides[position.index];

  return (
    <div className="presentation preview-mode">
      <Stage>
        <SlideFrame
          key={position.index}
          presentation={presentation}
          slide={slide}
          buildStep={position.step}
          direction={1}
          transition="none"
        />
      </Stage>
    </div>
  );
}
