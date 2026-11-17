import { useLayoutEffect, useRef, useState } from 'react';

/** Every slide is laid out on a canvas of this size, in CSS pixels, then scaled to fit. */
export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 720;

/** The largest scale at which the stage fits inside `area`, an element. */
function fitScale(area) {
  return Math.min(area.clientWidth / STAGE_WIDTH, area.clientHeight / STAGE_HEIGHT);
}

/**
 * The 1280×720 slide canvas, centered in the space its parent leaves it and
 * scaled uniformly to fit that space. The space is the `.stage-area` this
 * component renders, which fills what the view's layout gives it: the
 * window minus the progress bar and the navigation bar in the audience
 * view, the whole iframe in the presenter's preview. Layouts are written for
 * the fixed size and never see the space's.
 *
 * The slides mount only once the area has been measured, so they never lay
 * out at a wrong scale; the scale follows the area as it resizes (window
 * resizes, the navigation bar hiding in fullscreen). Pass `scale={1}` to
 * render at design size (the capture view does).
 */
export default function Stage({ children, scale: fixedScale }) {
  const areaRef = useRef(null);
  const [fittedScale, setFittedScale] = useState(null);

  useLayoutEffect(() => {
    if (fixedScale !== undefined) return undefined;
    const area = areaRef.current;
    const fit = () => setFittedScale(fitScale(area));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    return () => observer.disconnect();
  }, [fixedScale]);

  const scale = fixedScale ?? fittedScale;
  return (
    <div className="stage-area" ref={areaRef}>
      {scale !== null && (
        <div
          className="slide-stage"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
