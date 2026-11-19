import { useMemo } from 'react';
import { mediaUrl } from '../presentation/preload.js';

/**
 * One media item from slide content: `{ type: "image" | "gif" | "video", src, alt?, poster? }`.
 *
 * Videos autoplay muted and loop, the way slides use them; `controls` adds
 * the browser's controls. A video's `poster` (an image, usually its first
 * frame) shows until the video has a frame of its own, so the slide is
 * never empty while the video starts. Images load eagerly: a slide is on
 * screen when it mounts, and lazy loading only delays the first paint (and
 * the capture).
 *
 * The element is given the preloaded copy of each file when there is one
 * (`mediaUrl`), resolved when the item mounts and kept while it stays.
 */
export default function Media({ item, controls = false, className }) {
  const src = useMemo(() => mediaUrl(item.src), [item.src]);
  const poster = useMemo(() => (item.poster ? mediaUrl(item.poster) : undefined), [item.poster]);
  if (item.type === 'video') {
    return (
      <video
        className={className}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        controls={controls}
      />
    );
  }
  return <img className={className} src={src} alt={item.alt ?? ''} />;
}
