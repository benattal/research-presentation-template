/**
 * Sizing for the volume figures: each figure fills the space its layout
 * leaves free under the slide header, so it is measured rather than fixed.
 */
import { useLayoutEffect, useRef, useState } from 'react';

/**
 * A ref for a figure's container and its size in stage pixels
 * ({ width, height }, 0 × 0 until measured). Uses offset sizes, which the
 * stage's scale transform does not change, and follows resizes.
 */
export function useFigureSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = ref.current;
    const measure = () => {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      setSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}
