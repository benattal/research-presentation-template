import { useEffect, useRef } from 'react';
import { useAnimation, useStageCanvas } from '../canvas/canvas.js';

/**
 * A canvas of `width` × `height` stage pixels that `paint(ctx, progress)`
 * draws, in stage pixels. It animates progress from 0 to 1 over `duration`
 * ms whenever `animationKey` changes (a still frame in capture and for
 * reduced motion), and redraws the settled frame when `redrawKey` changes
 * (for mouse exploration). Pointer handlers receive the event and its
 * position in stage pixels relative to the canvas.
 */
export default function RoomView({
  width, height, paint, animationKey = '', duration = 0, redrawKey = '', className = '',
  onPointerDown, onPointerMove, onPointerUp, style,
}) {
  const [ref, ratio] = useStageCanvas();
  const paintRef = useRef(paint);
  paintRef.current = paint;
  const draw = (progress) => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    paintRef.current(ctx, progress);
  };
  useAnimation(`${animationKey}|${ratio}|${width}x${height}`, duration, draw);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) draw(1);
    mounted.current = true;
    // `draw` is recreated every render; only a new redrawKey repaints.
  }, [redrawKey]);

  const at = (handler) => handler && ((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = rect.width / width;
    handler(event, [(event.clientX - rect.left) / scale, (event.clientY - rect.top) / scale]);
  });

  return (
    <canvas
      ref={ref}
      className={className}
      width={Math.round(width * ratio)}
      height={Math.round(height * ratio)}
      style={{ width, height, display: 'block', borderRadius: 6, ...style }}
      onPointerDown={at(onPointerDown)}
      onPointerMove={at(onPointerMove)}
      onPointerUp={at(onPointerUp)}
    />
  );
}
