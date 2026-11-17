import { useState } from 'react';
import { clampPosition } from '../navigation/position.js';
import Stage from '../stage/Stage.jsx';
import SlideFrame from '../stage/SlideFrame.jsx';
import { usePresenterChannel } from './presenterChannel.js';

/**
 * The presenter window's preview iframe (`?mode=preview`): the slide the
 * audience window shows, on the same stage, following it through the
 * presenter channel. It renders without transitions and takes no input.
 */
export default function PreviewView({ presentation }) {
  const [position, setPosition] = useState({ index: 0, step: 0 });
  usePresenterChannel((received) => setPosition(clampPosition(presentation.slides, received)));
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
