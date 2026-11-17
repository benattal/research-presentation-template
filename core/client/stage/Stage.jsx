import { useEffect, useState } from 'react';

/** Every slide is laid out on a canvas of this size, in CSS pixels, then scaled to fit. */
export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 720;

function fitScale() {
  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
}

/**
 * The 1280×720 slide canvas, centered in the window and scaled uniformly to
 * fit it. Layouts are written for the fixed size and never see the window's.
 * Pass `scale={1}` to render at design size (the capture view does).
 */
export default function Stage({ children, scale: fixedScale }) {
  const [fittedScale, setFittedScale] = useState(fitScale);

  useEffect(() => {
    if (fixedScale !== undefined) return undefined;
    const onResize = () => setFittedScale(fitScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fixedScale]);

  const scale = fixedScale ?? fittedScale;
  return (
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
  );
}
