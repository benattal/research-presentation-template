/**
 * One media item from slide content: `{ type: "image" | "gif" | "video", src, alt? }`.
 *
 * Videos autoplay muted and loop, the way slides use them; `controls` adds
 * the browser's controls. Images load eagerly: a slide is on screen when it
 * mounts, and lazy loading only delays the first paint (and the capture).
 */
export default function Media({ item, controls = false, className }) {
  if (item.type === 'video') {
    return (
      <video className={className} src={item.src} autoPlay muted loop playsInline controls={controls} />
    );
  }
  return <img className={className} src={item.src} alt={item.alt ?? ''} />;
}
